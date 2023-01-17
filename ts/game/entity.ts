import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentType } from 'game/component'
import { GameObject, GameObjectBase } from 'game/core'
import { AttributesInitOptions } from 'game/component/attributes'
import { ProfileInitOptions } from 'game/component/profile'

import { defined } from 'util/common'
import { Timer } from 'util/timer'

export enum EntityType {
	UNKNOWN,

	PROJECTILE,
	WEAPON,

	BAZOOKA,
	BUILDING,
	CRATE,
	EXPLOSION,
	PLAYER,
	ROCKET,
	WALL,
}

export type EntityOptions = {
	id? : number;
	clientId? : number;

	attributesInit? : AttributesInitOptions;
	profileInit? : ProfileInitOptions

	onCreateFn? : (entity : Entity) => void;
}

export interface Entity extends GameObject {
	type() : EntityType;
	allTypes() : Set<EntityType>;
	id() : number;

	hasClientId() : boolean;
	clientId() : number;

	addComponent<T extends Component>(component : T) : T;
	hasComponent(type : ComponentType) : boolean;
	getComponent<T extends Component>(type : ComponentType) : T;

	collide(other : Entity, collision : MATTER.Collision) : void;
	newTimer() : Timer;
	setTTL(ttl : number);
}

enum Prop {
	UNKNOWN,
	CLIENT_ID,
	DELETED,
}

export abstract class EntityBase extends GameObjectBase implements Entity {
	protected _type : EntityType;
	protected _allTypes : Set<EntityType>;
	protected _id : number;
	protected _clientId : number;

	protected _timers : Array<Timer>;
	protected _notReadyCounter : number;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super("entity-" + type + "," + entityOptions.id);

		this._type = type;
		this._allTypes = new Set();
		this._allTypes.add(type);

		if (!defined(entityOptions.id)) {
			console.error("Warning: entity type " + type + " has no id");
		}
		this._id = entityOptions.id;
		if (defined(entityOptions.clientId)) {
			this._clientId = entityOptions.clientId;
		}

		this._timers = new Array();
		this._notReadyCounter = 0;

		this.registerProp(Prop.CLIENT_ID, {
			has: () => { return this.hasClientId(); },
			export: () => { return this.clientId(); },
			import: (obj : Object) => { this._clientId = <number>obj; },
		});
		this.registerProp(Prop.DELETED, {
			export: () => { return this.deleted(); },
			import: (obj : Object) => { if (<boolean>obj) { this.delete(); } },
		});
	}

	override ready() : boolean {
		if (this._notReadyCounter > 0 && this._notReadyCounter % 60 === 0) {
			console.error("Warning: %s still not ready", this.name());
		}

		for (const [_, component] of this.children()) {
			if (!component.ready()) {
				this._notReadyCounter++;
				return false;
			}
		}
		return true;
	}

	override dispose() : void {
		super.dispose();

		game.entities().unregisterEntity(this.id());
	}

	type() : EntityType { return this._type; }
	allTypes() : Set<EntityType> { return this._allTypes; }
	id() : number { return this._id; }

	hasClientId() : boolean { return defined(this._clientId); }
	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this.hasClientId() && this.clientId() === game.id() }

	addComponent<T extends Component>(component : T) : T {
		component.setEntity(this);
		return this.addChild<T>(component.type(), component);
	}
	hasComponent(type : ComponentType) : boolean { return this.hasChild(type); }
	getComponent<T extends Component>(type : ComponentType) : T { return this.getChild<T>(type); }

	newTimer() : Timer {
		let timer = new Timer();
		this._timers.push(timer);
		return timer;
	}
	setTTL(ttl : number) : void {
		const timer = this.newTimer();
		timer.start(ttl, () => { this.delete(); });
	}

	collide(entity : Entity, collision : MATTER.Collision) : void {}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this._timers.forEach((timer) => {
			timer.elapse(millis);
		});
	}

	override shouldBroadcast() : boolean { return game.options().host; }
	override isSource() : boolean { return game.options().host; }
}