import { game } from 'game'
import { GameState } from 'game/api'
import { GameData, DataFilter } from 'game/game_data'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { LevelType } from 'game/system/api'

import { NetworkGlobals } from 'global/network_globals'

import { Message, DataMap } from 'message'
import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { NetworkMessage, NetworkMessageType, NetworkProp } from 'message/network_message'

import { ChannelType } from 'network/api'

import { settings } from 'settings'

export class Runner extends SystemBase implements System  {
	private _seqNum : number;
	private _importSeqNum : number;
	private _updateSpeed : number;
	private _lastStepTime : number;
	private _sendFullMsg : boolean;

	constructor() {
		super(SystemType.RUNNER);

		this.addNameParams({
			base: "runner",
		});

		this._seqNum = 0;
		this._importSeqNum = 0;
		this._updateSpeed = 1;
		this._lastStepTime = 0;
		this._sendFullMsg = false;

		this.addProp<number>({
			export: () => { return this._updateSpeed; },
			import: (obj : number) => { this._updateSpeed = obj; },
		});
	}

	override ready() : boolean { return super.ready() && game.hasClientId(); }

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

	seqNum() : number { return this._seqNum; }
	importSeqNum() : number { return this._importSeqNum; }

	step() : void {
		if (!this.initialized()) {
			if (!this.ready()) {
				return;
			}
			this.initialize();
		}

		this._seqNum++;
		const stepData = {
			millis: this._updateSpeed * Math.min(Date.now() - this._lastStepTime, 32),
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
			const state = msg.get<GameState>(GameProp.STATE);
			switch (state) {
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
		this._importSeqNum = Math.max(this._importSeqNum, seqNum);
		this._seqNum = Math.max(this._seqNum, this._importSeqNum);	
		super.importData(data, seqNum);
	}

	getDataFilters() : Array<DataFilter> {
		if (this._sendFullMsg) {
			this._sendFullMsg = false;
			return [DataFilter.INIT];
		}
		return [DataFilter.TCP, DataFilter.UDP];
	}
	message(filter : DataFilter) : [NetworkMessage, boolean] {
		const [data, has] = this.dataMap(filter, this._seqNum);
		if (!has) {
			return [null, false];
		}

		let msg = new NetworkMessage(NetworkMessageType.GAME);
		msg.set<number>(NetworkProp.SEQ_NUM, this._seqNum);
		msg.set<Object>(NetworkProp.DATA, data);
		return [msg, true];
	}
}