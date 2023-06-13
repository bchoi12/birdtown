import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component } from 'game/component'
import { AttributeType, ComponentType } from 'game/component/api'
import { GameObject, GameObjectBase } from 'game/game_object'
import { Attributes, AttributesInitOptions } from 'game/component/attributes'
import { CardinalsInitOptions } from 'game/component/cardinals'
import { HexColorsInitOptions } from 'game/component/hex_colors'
import { ProfileInitOptions } from 'game/component/profile'
import { Stats } from 'game/component/stats'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'

import { CounterType } from 'ui/api'

import { defined } from 'util/common'

export type EntityOptions = {
	id? : number;
	clientId? : number;
	offline? : boolean;
	levelVersion? : number;

	attributesInit? : AttributesInitOptions;
	cardinalsInit? : CardinalsInitOptions;
	hexColorsInit? : HexColorsInitOptions;
	profileInit? : ProfileInitOptions
}

export interface Entity extends GameObject {
	type() : EntityType;
	allTypes() : Set<EntityType>;
	id() : number;

	hasClientId() : boolean;
	clientId() : number;
	clientIdMatches() : boolean;

	hasLevelVersion() : boolean;
	levelVersion() : number;

	addEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [T, boolean];
	addTrackedEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [T, boolean];

	addComponent<T extends Component>(component : T) : T;
	hasComponent(type : ComponentType) : boolean;
	getComponent<T extends Component>(type : ComponentType) : T;

	// Methods spanning components
	getCounts() : Map<CounterType, number>;
	setTTL(ttl : number);

	// Attribute methods
	hasAttribute(type : AttributeType) : boolean;

	// Stats methods
	takeDamage(amount : number, from? : Entity) : void;

	// Profile methods
	collide(collision : MATTER.Collision, other : Entity) : void;
}

export interface EquipEntity {
	equip(equip : Equip<Entity & EquipEntity>);
}

export abstract class EntityBase extends GameObjectBase implements Entity {
	protected _type : EntityType;
	protected _allTypes : Set<EntityType>;
	protected _id : number;
	protected _clientId : number;
	protected _levelVersion : number;
	protected _trackedEntities : Array<number>;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super("entity-" + type + "," + entityOptions.id);

		this._type = type;
		this._allTypes = new Set();
		this._allTypes.add(type);

		if (entityOptions.levelVersion) {
			this._levelVersion = entityOptions.levelVersion;
		}
		this._trackedEntities = [];

		if (!defined(entityOptions.id)) {
			console.error("Warning: entity type " + type + " has no id");
		}
		this._id = entityOptions.id;
		if (defined(entityOptions.clientId)) {
			this._clientId = entityOptions.clientId;
		}

		this.addProp<boolean>({
			has: () => { return this.deleted(); },
			export: () => { return this.deleted(); },
			import: (obj : boolean) => { if (obj) { this.delete(); } },
		});
		this.addProp<number>({
			has: () => { return this.hasClientId(); },
			export: () => { return this.clientId(); },
			import: (obj : number) => { this._clientId = obj; },
		});
		this.addProp<number>({
			has: () => { return this.hasLevelVersion(); },
			export: () => { return this._levelVersion; },
			import: (obj : number) => { this._levelVersion = obj; },
		});
	}

	override ready() : boolean {
		super.ready();

		for (const [_, component] of this.getChildren()) {
			if (!component.ready()) {
				return false;
			}
		}
		return true;
	}

	override delete() : void {
		super.delete();

		this._trackedEntities.forEach((id : number) => {
			game.entities().deleteEntity(id);
		});
	}

	override dispose() : void {
		super.dispose();

		if (!this.isOffline()) {
			game.entities().unregisterEntity(this.id());
		}
	}

	override preRender(millis : number) : void {
		super.preRender(millis);
	}

	type() : EntityType { return this._type; }
	allTypes() : Set<EntityType> { return this._allTypes; }
	id() : number { return this._id; }

	hasClientId() : boolean { return defined(this._clientId); }
	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this.hasClientId() && this.clientId() === game.clientId() }

	hasLevelVersion() : boolean { return defined(this._levelVersion); }
	levelVersion() : number { return this._levelVersion; }

	addEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [T, boolean] {
		return game.entities().addEntity(type, options);
	}
	addTrackedEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [T, boolean] {
		const [entity, hasEntity] = this.addEntity<T>(type, options);
		if (hasEntity) {
			this._trackedEntities.push(entity.id());
		}
		return [entity, hasEntity];
	}

	addComponent<T extends Component>(component : T) : T {
		component.setEntity(this);
		return this.registerChild<T>(component.type(), component);
	}
	hasComponent(type : ComponentType) : boolean { return this.hasChild(type); }
	getComponent<T extends Component>(type : ComponentType) : T { return this.getChild<T>(type); }

	getCounts() : Map<CounterType, number> { return new Map(); }
	setTTL(ttl : number) : void {
		const timer = this.newTimer();
		timer.start(ttl, () => { this.delete(); });
	}

	hasAttribute(type : AttributeType) : boolean {
		if (!this.hasComponent(ComponentType.ATTRIBUTES)) { return false; }

		return this.getComponent<Attributes>(ComponentType.ATTRIBUTES).hasAttribute(type);
	}

	takeDamage(amount : number, from? : Entity) : void {
		if (!this.hasComponent(ComponentType.STATS)) { return; }

		this.getComponent<Stats>(ComponentType.STATS).damage(amount, from);
	}
	collide(collision : MATTER.Collision, other : Entity) : void {}
}