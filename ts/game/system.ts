import { game } from 'game'
import { GameObject, GameObjectBase } from 'game/core'
import { Entity } from 'game/entity'

import { Data, DataFilter, DataMap } from 'network/data'
import { Message, MessageType } from 'network/message'

import { defined } from 'util/common'

export enum SystemType {
	UNKNOWN,
	CLIENT_INFO,
	CLIENTS,
	ENTITIES,
	ENTITY_MAP,
	INPUT,
	KEYS,
	LAKITU,
	LEVEL,
	PHYSICS,
	WORLD,
}

export interface System extends GameObject {
	type() : SystemType;

	hasTargetEntity() : boolean;
	targetEntity() : Entity;
	setTargetEntity(entity : Entity) : void;
}

export abstract class SystemBase extends GameObjectBase implements System {
	protected _targetEntity : Entity;
	protected _type : SystemType;

	constructor(type : SystemType) {
		super("system-" + type);

		this._targetEntity = null;
		this._type = type;
	}

	override ready() : boolean { return true; }

	type() : SystemType { return this._type; }
	hasTargetEntity() : boolean { return defined(this._targetEntity); }
	targetEntity() : Entity { return this._targetEntity; }
	setTargetEntity(entity : Entity) : void {
		this._targetEntity = entity;
		this.setName({
			base: this.name(),
			target: entity,
		});
	}

	override shouldBroadcast() : boolean { return game.options().host; }
	override isSource() : boolean { return game.options().host; }
}

export class SystemRunner {

	// TODO: add iteration order to GameObject?
	private _order : Array<SystemType>;
	private _systems : Map<SystemType, System>;
	private _seqNum : number;

	constructor() {
		this._order = new Array();
		this._systems = new Map();
		this._seqNum = 0;
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

	update(millis : number) : void {
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
			this.getSystem(this._order[i]).preRender();
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).render();
		}

		for (let i = 0; i < this._order.length; ++i) {
			this.getSystem(this._order[i]).postRender();
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