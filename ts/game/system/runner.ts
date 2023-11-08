import { game } from 'game'
import { GameState } from 'game/api'
import { DataFilter } from 'game/game_data'
import { System, SystemBase } from 'game/system'
import { SystemType, RunnerMode } from 'game/system/api'

import { Message, DataMap } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { ChannelType } from 'network/api'

import { settings } from 'settings'

import { ui } from 'ui'

import { NumberRingBuffer } from 'util/buffer/number_ring_buffer'

export class Runner extends SystemBase implements System  {

	private static readonly _minFrameTime = 1;

	private static readonly _channelMapping = new Map<DataFilter, ChannelType>([
		[DataFilter.INIT, ChannelType.TCP],
		[DataFilter.TCP, ChannelType.TCP],
		[DataFilter.UDP, ChannelType.UDP],
	]);

	private _seqNum : number;
	private _importSeqNum : number;
	private _updateSpeed : number;
	private _lastStepTime : number;

	private _mode : RunnerMode;
	private _seqNumStep : number;

	private _stepTimes : NumberRingBuffer;
	private _seqNumDiffs : NumberRingBuffer;

	private _sendFullMsg : boolean;

	constructor() {
		super(SystemType.RUNNER);

		this._seqNum = 0;
		this._importSeqNum = 0;
		this._updateSpeed = 1;
		this._lastStepTime = 0;

		this._mode = RunnerMode.UNKNOWN;
		this._seqNumStep = 0;

		// TODO: make configurable
		this.setMode(RunnerMode.NORMAL);

		this._stepTimes = new NumberRingBuffer(30);
		this._seqNumDiffs = new NumberRingBuffer(10);

		this._sendFullMsg = false;

		this.addProp<number>({
			export: () => { return this._updateSpeed; },
			import: (obj : number) => { this._updateSpeed = obj; },
		});
	}

	override ready() : boolean {
		return super.ready() && game.hasClientId() && this._mode !== RunnerMode.UNKNOWN && (this.isSource() || this._seqNum > 0);
	}
	override initialize() : void {
		super.initialize();
		this._lastStepTime = Date.now();
	}

	push<T extends System>(system : T) : void {
		if (this.hasChild(system.type())) {
			console.error("Error: skipping duplicate system with type %d, name %s", system.type(), system.name());
			return;
		}
		this.registerChild(system.type(), system);
	}

	getSystem<T extends System>(type : SystemType) : T { return this.getChild<T>(type); }

	setMode(mode : RunnerMode) : void {
		if (this._mode === mode) {
			return;
		}

		this._mode = mode;

		switch (mode) {
		case RunnerMode.MINIMUM:
			this._seqNumStep = 64;
			break;
		case RunnerMode.SLOW:
			this._seqNumStep = 32;
			break;
		case RunnerMode.NORMAL:
			this._seqNumStep = 16;
			break;
		case RunnerMode.FAST:
			this._seqNumStep = 8;
			break;
		default:
			console.error("Error: unknown runner mode", RunnerMode[this._mode]);
			this._seqNumStep = 0;
		}

		this._seqNumStep = Math.round(this._seqNumStep / Runner._minFrameTime);
	}

	seqNum() : number { return this._seqNum; }
	seqNumStep() : number { return this._seqNumStep; }
	frameDiff() : number { return this.isSource() ? 0 : Math.round(this._seqNumDiffs.peek() / this.seqNumStep()); }

	stepTime() : number { return this._stepTimes.average(); }
	runGameLoop() : void {
	   	game.netcode().preStep();

	   	if (!this.initialized() && this.ready()) {
	   		this.initialize();
	   	}
	   	if (this.initialized()) {
			this.gameFrame();
	   	}
    	setTimeout(() => {
    		this.runGameLoop();
    	}, Runner._minFrameTime * this._seqNumStep);
	}

	gameFrame() : void {
		let seqNumStep = this._seqNumStep;
		if (!this.isSource()) {
			const seqNumDiff = this._seqNum - this._importSeqNum;
			this._seqNumDiffs.push(seqNumDiff);
			const timeDiff = Math.round(seqNumDiff * Runner._minFrameTime);

			if (Math.abs(timeDiff) > 1000) {
				this._seqNum = this._importSeqNum;
			} else if (Math.abs(timeDiff) > this._seqNumStep * Runner._minFrameTime) {
				const coeff = 1 - Math.sign(timeDiff) * Math.min(Math.abs(timeDiff), 500) / 1000
				seqNumStep = Math.round(coeff * seqNumStep);
			}
		}

		this._seqNum += seqNumStep;
		const stepData = {
			millis: this._updateSpeed * Runner._minFrameTime * seqNumStep,
			realMillis: Date.now() - this._lastStepTime,
			seqNum: this._seqNum,
		}
		this._lastStepTime = Date.now();

    	this.preUpdate(stepData);
    	this.update(stepData);
    	this.postUpdate(stepData);
    	this.prePhysics(stepData);
    	this.physics(stepData);
    	this.postPhysics(stepData);
    	this.updateData(this._seqNum);

    	for (const filter of this.getDataFilters()) {
			const [msg, has] = this.message(filter);
			if (has) {
				game.netcode().broadcast(Runner._channelMapping.get(filter), msg);
			}
    	}

    	this.cleanup();
    	ui.clearKeys();
    	this._stepTimes.push(Date.now() - this._lastStepTime);
	}

	renderFrame() : void {
		this.preRender();
		this.render();
		this.postRender();
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
				this._updateSpeed = 0.3;
				break;
			default:
				this._updateSpeed = 1;
			}
		}
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		this._importSeqNum = Math.max(this._importSeqNum, seqNum);

		if (this._seqNum === 0) {
			this._seqNum = this._importSeqNum;
		}
	}

	private getDataFilters() : Array<DataFilter> {
		if (this._sendFullMsg) {
			this._sendFullMsg = false;
			return [DataFilter.INIT];
		}
		return [DataFilter.TCP, DataFilter.UDP];
	}

	private message(filter : DataFilter) : [NetworkMessage, boolean] {
		const [data, has] = this.dataMap(filter, this._seqNum);
		if (!has) {
			return [null, false];
		}

		let msg = new NetworkMessage(NetworkMessageType.GAME);
		msg.setSeqNum(this._seqNum);
		msg.setData( data);
		return [msg, true];
	}
}