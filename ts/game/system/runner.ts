import { game } from 'game'
import { GameState } from 'game/api'
import { DataFilter } from 'game/game_data'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { Message, DataMap } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { ChannelType } from 'network/api'

import { settings } from 'settings'
import { SpeedSetting } from 'settings/api'

import { ui } from 'ui'

import { NumberRingBuffer } from 'util/buffer/number_ring_buffer'
import { Stepper, StepperStats } from 'util/stepper'

export class Runner extends SystemBase implements System  {

	// Support up to 4Hz
	private static readonly _gameTimePerStep = 4;

	// Support up to 500fps
	private static readonly _renderTimePerStep = 2;

	// Snap seqNum to host when time diff is above a threshold
	private static readonly _clientSnapThreshold = 1000;

	private static readonly _channelMapping = new Map<DataFilter, ChannelType>([
		[DataFilter.INIT, ChannelType.TCP],
		[DataFilter.TCP, ChannelType.TCP],
		[DataFilter.UDP, ChannelType.UDP],
	]);

	private static readonly _targetFrameTimes = new Map<SpeedSetting, number>([
		[SpeedSetting.SLOW, 32],
		[SpeedSetting.NORMAL, 16],
		[SpeedSetting.FAST, 8],
	]);

	private _speed : SpeedSetting;
	private _actualSpeed : SpeedSetting;

	private _gameStepper : Stepper;
	private _gameTargetStep : number;
	private _renderStepper : Stepper;
	private _renderTargetStep : number;

	private _importSeqNum : number;
	private _seqNumDiffs : NumberRingBuffer;
	private _sendFullMsg : boolean;

	constructor() {
		super(SystemType.RUNNER);

		this._speed = SpeedSetting.AUTO;
		this._actualSpeed = SpeedSetting.NORMAL;

		this._gameStepper = new Stepper({ timePerStep: Runner._gameTimePerStep });
		this._renderStepper = new Stepper({ timePerStep: Runner._renderTimePerStep });
		this._gameTargetStep = Runner._targetFrameTimes.get(this._actualSpeed) / Runner._gameTimePerStep;
		this._renderTargetStep = Runner._targetFrameTimes.get(this._actualSpeed) / Runner._renderTimePerStep;

		this._importSeqNum = 0;
		this._seqNumDiffs = new NumberRingBuffer(10);
		this._sendFullMsg = false;
	}

	override ready() : boolean {
		return super.ready() && game.hasClientId() && this.speed() !== SpeedSetting.UNKNOWN;
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (!this.isSource()) {
			return;
		}

		switch(msg.type()) {
		case GameMessageType.CLIENT_JOIN:
		case GameMessageType.LEVEL_LOAD:
			this._sendFullMsg = true;
			break;
		case GameMessageType.GAME_STATE:
			switch (msg.getGameState()) {
			case GameState.FINISH:
			case GameState.ERROR:
				this._gameStepper.setUpdateSpeed(0.3);
				break;
			default:
				this._gameStepper.setUpdateSpeed(1);
			}
		}
	}

	push<T extends System>(system : T) : void {
		if (this.hasChild(system.type())) {
			console.error("Error: skipping duplicate system with type %d, name %s", system.type(), system.name());
			return;
		}
		this.registerChild(system.type(), system);
	}

	getSystem<T extends System>(type : SystemType) : T { return this.getChild<T>(type); }

	// TODO: split game and render loop
	speed() : SpeedSetting { return this._actualSpeed; }
	setSpeed(speed : SpeedSetting) : void {
		if (this._speed === speed) {
			return;
		}

		if (this.setActualSpeed(speed === SpeedSetting.AUTO ? SpeedSetting.NORMAL : speed)) {
			this._speed = speed;
		}
	}
	private setActualSpeed(speed : SpeedSetting) : boolean {
		if (this._actualSpeed === speed) {
			return true;
		}
		if (!Runner._targetFrameTimes.has(speed)) {
			console.error("Error: tried to set runner to speed with undefined target frame time, %s", SpeedSetting[speed]);
			return false;
		}

		this._actualSpeed = speed;
		this._gameTargetStep = Runner._targetFrameTimes.get(this._actualSpeed) / Runner._gameTimePerStep;
		this._renderTargetStep = Runner._targetFrameTimes.get(this._actualSpeed) / Runner._renderTimePerStep;

		let speedMsg = new GameMessage(GameMessageType.RUNNER_SPEED);
		speedMsg.setGameSpeed(speed);
		speedMsg.setRenderSpeed(speed);
		game.handleMessage(speedMsg);
	}

 	targetStepTime() : number { return this._gameTargetStep * this._gameStepper.timePerStep(); }
 	lastStep() : number { return this._gameStepper.lastStep(); }
	seqNumDiff() : number { return this.isSource() ? 0 : Math.round(this._seqNumDiffs.peek() / this._gameTargetStep); }
 
 	getGameStats() : StepperStats { return this._gameStepper.stats(); }
 	getRenderStats() : StepperStats { return this._renderStepper.stats(); }

	runGameLoop() : void {
	   	game.netcode().preStep();
	   	if (!this.initialized() && this.ready()) {
	   		this.initialize();
	   	}
	   	if (this.initialized()) {
	   		this._gameStepper.prepareStep(this.getGameStep());
	   		this.gameStep(this._gameStepper.getStepData());
	   		this._gameStepper.endStep();
	   	}
    	setTimeout(() => {
    		this.runGameLoop();
    	}, this.targetStepTime());
	}
	runRenderLoop() : void {
	   	if (this.initialized()) {
	   		this._renderStepper.prepareStep(this.getRenderStep());
	   		this.renderFrame(this._renderStepper.getStepData());
	   		this._renderStepper.endStep();
	   	}
    	setTimeout(() => {
    		this.runRenderLoop();
    	}, this._renderTargetStep * this._renderStepper.timePerStep());
	}

	private getGameStep() : number {
		let currentStep = this._gameStepper.timeSinceLastStep() / this._gameStepper.timePerStep();

		if (currentStep > 1.3 * this._gameTargetStep) {
			currentStep = this._gameTargetStep;
		}

		if (!this.isSource()) {
			const seqNumDiff = this._gameStepper.seqNum() - this._importSeqNum;
			this._seqNumDiffs.push(seqNumDiff);

			const timeDiff = Math.round(seqNumDiff * this._gameStepper.timePerStep());
			if (Math.abs(timeDiff) > Runner._clientSnapThreshold) {
				this._gameStepper.setSeqNum(this._importSeqNum);
			} else if (Math.abs(timeDiff) > currentStep * this._gameStepper.timePerStep()) {
				const coeff = 1 - Math.sign(timeDiff) * Math.min(0.3, Math.abs(timeDiff) / Runner._clientSnapThreshold);
				currentStep *= coeff;
			}
		}

		return currentStep;
	}

	private getRenderStep() : number {
		return this._renderStepper.timeSinceLastStep() / this._renderStepper.timePerStep();
	}

	private gameStep(stepData : StepData) : void {
    	this.preUpdate(stepData);
    	this.update(stepData);
    	this.postUpdate(stepData);
    	this.prePhysics(stepData);
    	this.physics(stepData);
    	this.postPhysics(stepData);
    	this.updateData(stepData.seqNum);

    	for (const filter of this.getDataFilters()) {
			const [data, has] = this.dataMap(filter, stepData.seqNum);
			if (!has) {
				continue;
			}

			let msg = new NetworkMessage(NetworkMessageType.GAME);
			msg.setSeqNum(stepData.seqNum);
			msg.setData(data);
			game.netcode().broadcast(Runner._channelMapping.get(filter), msg);
    	}
    	this.cleanup();
    	ui.clearKeys();
	}

	private renderFrame(stepData : StepData) : void {
		this.preRender();
		this.render();
		this.postRender();
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		this._importSeqNum = Math.max(this._importSeqNum, seqNum);
	}

	private getDataFilters() : Array<DataFilter> {
		if (this._sendFullMsg) {
			this._sendFullMsg = false;
			return [DataFilter.INIT];
		}
		return [DataFilter.TCP, DataFilter.UDP];
	}
}