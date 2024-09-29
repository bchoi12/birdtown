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
import { StatusType } from 'ui/api'

import { NumberRingBuffer } from 'util/buffer/number_ring_buffer'
import { isFirefox } from 'util/common'
import { Stepper, StepperStats } from 'util/stepper'

export class Runner extends SystemBase implements System  {

	// Snap seqNum to host when time diff is above a threshold
	private static readonly _clientSnapThreshold = 1000;

	// Max speedup is 10%
	private static readonly _maxSpeedUp = 1.1;

	private static readonly _warmupTime = 10000;
	private static readonly _degradedThreshold = 0.5;
	private static readonly _okThreshold = 0.8;

	private static readonly _channelMapping = new Map<DataFilter, ChannelType>([
		[DataFilter.INIT, ChannelType.TCP],
		[DataFilter.TCP, ChannelType.TCP],
		[DataFilter.UDP, ChannelType.UDP],
	]);

	private static readonly _targetSteps = new Map<SpeedSetting, number>([
		[SpeedSetting.SLOW, 32],
		[SpeedSetting.NORMAL, 16],
		[SpeedSetting.FAST, 8],
	]);

	private _gameSpeed : SpeedSetting;
	private _renderSpeed : SpeedSetting;

	private _gameStepper : Stepper;
	private _gameTargetStep : number;
	private _renderStepper : Stepper;
	private _renderTargetStep : number;

	private _importSeqNum : number;
	private _seqNumDiffs : NumberRingBuffer;
	private _sendFullMsg : boolean;
	private _degraded : boolean;
	private _hostDegraded : boolean;

	constructor() {
		super(SystemType.RUNNER);

		this._gameSpeed = SpeedSetting.NORMAL;
		this._renderSpeed = settings.fpsSetting;

		this._gameStepper = new Stepper();
		this._renderStepper = new Stepper();

		this._gameTargetStep = Runner._targetSteps.get(this._gameSpeed);
		this._renderTargetStep = Runner._targetSteps.get(this._renderSpeed);

		this._importSeqNum = 0;
		this._seqNumDiffs = new NumberRingBuffer(10);
		this._sendFullMsg = false;
		this._degraded = false;
		this._hostDegraded = false;

		this.addProp<boolean>({
			export: () => { return this._degraded; },
			import: (obj : boolean) => { this.setHostDegraded(obj); }
		})
	}

	override ready() : boolean {
		return super.ready() && game.hasClientId();
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch(msg.type()) {
		case GameMessageType.GAME_STATE:
			switch (msg.getGameState()) {
			case GameState.FINISH:
			case GameState.VICTORY:
			case GameState.ERROR:
				this._gameStepper.setUpdateSpeed(0.3);
				break;
			default:
				this._gameStepper.setUpdateSpeed(1);
			}
		}

		if (!this.isSource()) {
			return;
		}

		switch(msg.type()) {
		case GameMessageType.CLIENT_JOIN:
		case GameMessageType.LEVEL_LOAD:
			this._sendFullMsg = true;
			break;
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

	renderSpeed() : SpeedSetting { return this._renderSpeed; }
	setRenderSpeed(speed : SpeedSetting) : boolean {
		if (this._renderSpeed === speed) {
			return true;
		}
		if (!Runner._targetSteps.has(speed)) {
			console.error("Error: tried to set runner to speed with undefined target frame time, %s", SpeedSetting[speed]);
			return false;
		}

		this._renderSpeed = speed;
		this._renderTargetStep = Runner._targetSteps.get(this._renderSpeed);
	}

	updateSpeed() : number { return this._gameStepper.updateSpeed(); }
	setUpdateSpeed(mult : number) : void { this._gameStepper.setUpdateSpeed(mult); }
 	gameTargetStep() : number {return Runner._targetSteps.get(this._gameSpeed); }
 	gameTargetFPS() : number { return Math.floor(1000 / Runner._targetSteps.get(this._gameSpeed)); }
 	renderTargetStep() : number { return Runner._targetSteps.get(this._renderSpeed); }
 	lastStep() : number { return this._gameStepper.lastStep(); }
 	gameSeqNum() : number { return this._gameStepper.seqNum(); }
	seqNumDiff() : number { return this.isSource() ? 0 : Math.round(this._seqNumDiffs.peek() / this._gameTargetStep); }
 
 	computeGameStats() : StepperStats { return this._gameStepper.computeStats(); }
 	computeRenderStats() : StepperStats { return this._renderStepper.computeStats(); }

	runGameLoop() : void {
	   	if (!this.initialized() && this.ready()) {
	   		this.initialize();
	   	}

	   	if (this.initialized()) {
		   	game.netcode().preStep();
	   		this._gameStepper.beginStep(this.getGameStep());
	   		this.gameStep(this._gameStepper.getStepData());
	   		this._gameStepper.endStep();

   			const ratio = this._gameStepper.stepsPerSecond() / this.gameTargetFPS();
   			if (ratio < Runner._degradedThreshold) {
   				this.setDegraded(true);
   			} else if (ratio > Runner._okThreshold) {
   				this.setDegraded(false);
   			}
	   	}

	   	let interval = Math.max(1, Math.floor(this.gameTargetStep() - this._gameStepper.timeSinceBeginStep()));
	   	// Terrible hack to fix Firefox perf
	   	if (isFirefox()) { interval /= 2; }
    	setTimeout(() => { this.runGameLoop(); }, interval);
	}
	runRenderLoop() : void {
	   	if (this.initialized()) {
	   		this._renderStepper.beginStep(this.getRenderStep());
	   		this.renderFrame(this._renderStepper.getStepData());
	   		this._renderStepper.endStep();
	   	}
	   	let interval = Math.max(1, Math.floor(this.renderTargetStep() - this._renderStepper.timeSinceBeginStep()));
	   	// Terrible hack to fix Firefox perf
	   	if (isFirefox()) { interval /= 2; }
    	setTimeout(() => { this.runRenderLoop(); }, interval);
	}

	private getGameStep() : number {
		let currentStep = this._gameStepper.timeSinceBeginStep();

		if (currentStep > Runner._maxSpeedUp * this.gameTargetStep()) {
			currentStep = this.gameTargetStep();
		}

		if (!this.isSource()) {
			const seqNumDiff = this._gameStepper.seqNum() - this._importSeqNum;
			this._seqNumDiffs.push(seqNumDiff);

			if (Math.abs(seqNumDiff) > Runner._clientSnapThreshold) {
				this._gameStepper.setSeqNum(this._importSeqNum);
			} else if (Math.abs(seqNumDiff) > currentStep) {
				const coeff = 1 - Math.sign(seqNumDiff) * Math.min(0.3, Math.abs(seqNumDiff) / Runner._clientSnapThreshold);
				currentStep *= coeff;
			}
		}

		return Math.floor(currentStep);
	}

	private getRenderStep() : number { return this._renderStepper.timeSinceBeginStep(); }

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

	private setDegraded(degraded : boolean) : void {
		if (this._degraded === degraded) {
			return;
		}

		this._degraded = degraded;

		if (this._degraded) {
	   		if (ui.focused() && ui.timeSinceFocusChange() > Runner._warmupTime) {
				ui.showStatus(StatusType.DEGRADED);
			}
		} else {
			ui.hideStatus(StatusType.DEGRADED);
		}
	}
	private setHostDegraded(degraded : boolean) : void {
		if (this._hostDegraded === degraded) {
			return;
		}

		this._hostDegraded = degraded;

		if (this._hostDegraded) {
			ui.showStatus(StatusType.HOST_DEGRADED);
		} else {
			ui.hideStatus(StatusType.HOST_DEGRADED);
		}
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