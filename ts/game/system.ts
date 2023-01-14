import { game } from 'game'
import { GameObject, GameObjectBase } from 'game/core'
import { Entity } from 'game/entity'

import { Data, DataFilter, DataMap } from 'network/data'

import { defined } from 'util/common'

export enum SystemType {
	UNKNOWN,
	ENTITIES,
	ENTITY_MAP,
	INPUT,
	KEYS,
	LAKITU,
	PHYSICS,
	WORLD,
}

export interface System extends GameObject {
	type() : SystemType;

	hasTargetEntity() : boolean;
	targetEntity() : Entity;
	setTargetEntity(entity : Entity) : void;
}

// TODO: add seqNum
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

// TODO: system runner
export class SystemRunner {

	private _order : Array<SystemType>;
	private _systems : Map<SystemType, System>;

	constructor() {
		this._order = new Array();
		this._systems = new Map();
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

	update(millis : number) : void {
		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).preUpdate(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).update(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).postUpdate(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).prePhysics(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).physics(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).postPhysics(millis);
		}

		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).preRender();
		}

		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).render();
		}

		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).postRender();
		}
	}

	updateData(seqNum : number) : void {
		for (let i = 0; i < this._order.length; ++i) {
			this._systems.get(this._order[i]).updateData(seqNum);
		}
	}
}