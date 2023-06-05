import { game } from 'game'
import { GameData, DataFilter } from 'game/game_data'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { LevelType } from 'game/system/api'

import { Message, DataMap } from 'message'
import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { NetworkMessageType } from 'message/api'
import { NetworkMessage, NetworkProp } from 'message/network_message'

import { ChannelType } from 'network/api'

export class Runner extends SystemBase implements System  {
	private static readonly _maxFrameMillis = 32;

	private _seqNum : number;
	private _updateSpeed : number;

	constructor() {
		super(SystemType.RUNNER);

		this.setName({
			base: "runner",
		});

		this._seqNum = 0;
		this._updateSpeed = 1.0;

		this.addProp<number>({
			export: () => { return this._updateSpeed; },
			import: (obj : number) => { this._updateSpeed = obj; },
		});
	}

	override ready() : boolean { return super.ready() && game.hasClientId(); }

	push<T extends System>(system : T) : T {
		if (this.hasChild(system.type())) {
			console.error("Error: skipping duplicate system with type %d, name %s", system.type(), system.name());
			return;
		}

		this.registerChild(system.type(), system);
		return system;
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

    	const millis = Math.min(this.millisSinceUpdate(), Runner._maxFrameMillis) * this._updateSpeed;
    	this.preUpdate(millis);
    	this.update(millis);
    	this.postUpdate(millis);
    	this.prePhysics(millis);
    	this.physics(millis);
    	this.postPhysics(millis);
    	this.preRender(millis);
    	this.render(millis);
    	this.postRender(millis);

    	this.updateData(this._seqNum);
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
			const [msg, has] = this.message(DataFilter.INIT);
			if (has) {
				connection.broadcast(ChannelType.TCP, msg);
			}
			break;
		}
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		if (!this.isSource()) {
			this._seqNum = Math.max(this._seqNum, seqNum);
		}
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