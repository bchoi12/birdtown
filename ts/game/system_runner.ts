import { game } from 'game'
import { System, SystemType } from 'game/system'
import { LevelType } from 'game/system/level'

import { ChannelType } from 'network/netcode'
import { Data, DataFilter, DataMap } from 'network/data'
import { Message, MessageType } from 'network/message'

export class SystemRunner {
	private static readonly _maxFrameMillis = 32;

	private _order : Array<SystemType>;
	private _systems : Map<SystemType, System>;
	private _seqNum : number;
	private _lastUpdateTime : number;
	private _updateSpeed : number;

	constructor() {
		this._order = new Array();
		this._systems = new Map();
		this._seqNum = 0;
		this._lastUpdateTime = Date.now();
		this._updateSpeed = 1.0;
	}

	push<T extends System>(system : T) : T {
		if (this._systems.has(system.type())) {
			console.error("Error: skipping duplicate system with type %d, name %s", system.type(), system.name());
			return;
		}

		this._order.push(system.type());
		this._systems.set(system.type(), system);
		return system;
	}

	getSystem<T extends System>(type : SystemType) : T { return <T>this._systems.get(type); }

	initialize() : void {
		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).initialize();
		}
	}

	setUpdateSpeed(speed : number) : void { this._updateSpeed = speed; }
	update() : void {
    	const millis = Math.min(Date.now() - this._lastUpdateTime, SystemRunner._maxFrameMillis) * this._updateSpeed;
		this._lastUpdateTime = Date.now();
		this._seqNum++;

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).preUpdate(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).update(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).postUpdate(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).prePhysics(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).physics(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).postPhysics(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).preRender(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).render(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).postRender(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).updateData(this._seqNum);
		}
	}

	importData(data : DataMap, seqNum : number) : void {
		for (let i = 0; i < this._order.length; ++i) {
			let system = this.getSystem(this._order[i]);

			if (!data.hasOwnProperty(system.type())) {
				continue;
			}
			system.importData(<DataMap>data[system.type()], seqNum);
		}
	}

	onSetGameId(gameId : number) : void {
		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).onSetGameId(gameId);
		}
	}

	onNewClient(name : string, clientId : number) : void {
		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).onNewClient(name, clientId);
		}

		const connection = game.netcode();
		const [message, has] = this.message(DataFilter.ALL);
		if (has) {
			connection.send(name, ChannelType.TCP, message);
		}
	}

	onLevelLoad(level : LevelType, seed : number) : void {
		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).onLevelLoad(level, seed);
		}
	}

	message(filter : DataFilter) : [Message, boolean] {
		let msg = {
			T: MessageType.GAME,
			S: this._seqNum,
			D: {},
		}

		let hasMessage = false;
		for (let i = 0; i < this._order.length; ++i) {
			const system = this.getSystem(this._order[i]);
			const [data, has] = system.dataMap(filter);

			if (has) {
				msg.D[system.type()] = data;
				hasMessage = true;
			}
		}

		return [msg, hasMessage];
	}
}