import { game } from 'game'
import { GameData, DataFilter } from 'game/game_data'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { LevelType } from 'game/system/api'

import { NetworkGlobals } from 'global/network_globals'

import { Message, DataMap } from 'message'
import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { NetworkMessage, NetworkMessageType, NetworkProp } from 'message/network_message'

import { ChannelType } from 'network/api'

import { SeqMap } from 'util/seq_map'

export class Runner extends SystemBase implements System  {
	private static readonly _maxFrameMillis = 32;

	private _rollbackBuffer : SeqMap<number, DataMap>;
	private _seqNum : number;
	private _updateSpeed : number;

	constructor() {
		super(SystemType.RUNNER);

		this.setName({
			base: "runner",
		});

		this._rollbackBuffer = new SeqMap(NetworkGlobals.rollbackBufferSize);
		this._seqNum = 0;
		this._updateSpeed = 1.0;

		this.addProp<number>({
			export: () => { return this._updateSpeed; },
			import: (obj : number) => { this._updateSpeed = obj; },
		});
	}

	override ready() : boolean { return super.ready() && game.hasClientId(); }

	push<T extends System>(system : T) : void {
		if (this.hasChild(system.type())) {
			console.error("Error: skipping duplicate system with type %d, name %s", system.type(), system.name());
			return;
		}
		this.registerChild(system.type(), system);
	}

	getSystem<T extends System>(type : SystemType) : T { return this.getChild<T>(type); }

	seqNum() : number { return this._seqNum; }
	setUpdateSpeed(speed : number) : void { this._updateSpeed = speed; }

	step() : void {
		if (!this.initialized()) {
			if (!this.ready()) {
				return;
			}
			this.initialize();
		}

		if (this.isSource()) {
			this._seqNum++;
		}

    	const stepData = {
    		millis: Math.min(this.millisSinceUpdate(), Runner._maxFrameMillis) * this._updateSpeed,
    		seqNum: this._seqNum,
    	}
    	this.preUpdate(stepData);
    	this.update(stepData);
    	this.postUpdate(stepData);
    	this.prePhysics(stepData);
    	this.physics(stepData);
    	this.postPhysics(stepData);
    	this.preRender(stepData);

    	// TODO: separate render from game loop?
    	this.render(stepData);

    	this.postRender(stepData);

    	this.stepData(this._seqNum);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (!this.isSource()) {
			return;
		}

		switch(msg.type()) {
		case GameMessageType.NEW_CLIENT:
		case GameMessageType.LEVEL_LOAD:
			const connection = game.netcode();
			const [initMessage, has] = this.message(DataFilter.INIT);
			if (has) {
				connection.broadcast(ChannelType.TCP, initMessage);
			}
			break;
		}
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		if (this.isSource()) {
			return;
		}

		let [currentData, ok] = this._rollbackBuffer.get(seqNum);
		if (ok) {
			this._rollbackBuffer.insert(seqNum, {...currentData, ...data});
		} else {
			let [prev, hasPrev] = this._rollbackBuffer.prev(seqNum);
			if (hasPrev) {
				let [prevData, _] = this._rollbackBuffer.get(prev); 
				this._rollbackBuffer.insert(seqNum, {...prevData, ...data});
			} else {
				this._rollbackBuffer.insert(seqNum, data);
			}
		}

		let [next, hasNext] = this._rollbackBuffer.next(seqNum);
		while (hasNext) {
			let [nextData, _] = this._rollbackBuffer.get(next);
			this._rollbackBuffer.insert(seqNum, {...data, ...nextData});

			[next, hasNext] = this._rollbackBuffer.next(seqNum);
		}

		// TODO: needed?
		this._seqNum = Math.max(this._seqNum, seqNum);
	}

	message(filter : DataFilter) : [NetworkMessage, boolean] {
		const [data, has] = this.dataMap(filter, this._seqNum);
		if (!has) {
			return [null, false];
		}

		let msg = new NetworkMessage(NetworkMessageType.GAME);
		msg.setProp<number>(NetworkProp.SEQ_NUM, this._seqNum)
			.setProp<Object>(NetworkProp.DATA, data);
		return [msg, true];
	}
}