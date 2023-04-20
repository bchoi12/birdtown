import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component } from 'game/component'
import { ComponentType } from 'game/component/api'
import { GameObject, GameObjectBase } from 'game/game_object'
import { AttributesInitOptions } from 'game/component/attributes'
import { CardinalsInitOptions } from 'game/component/cardinals'
import { Health } from 'game/component/health'
import { HexColorsInitOptions } from 'game/component/hex_colors'
import { ProfileInitOptions } from 'game/component/profile'
import { EntityType } from 'game/entity/api'

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

	addEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [Entity, boolean];
	addTrackedEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [Entity, boolean];

	addComponent<T extends Component>(component : T) : T;
	hasComponent(type : ComponentType) : boolean;
	getComponent<T extends Component>(type : ComponentType) : T;

	takeDamage(amount : number, from? : Entity) : void;
	collide(collision : MATTER.Collision, other : Entity) : void;
	setTTL(ttl : number);
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

		if (entityOptions.offline) {
			this.setOffline(entityOptions.offline);
		}

		this.addProp<number>({
			has: () => { return this.hasClientId(); },
			export: () => { return this.clientId(); },
			import: (obj : number) => { this._clientId = obj; },
		});
		this.addProp<boolean>({
			has: () => { return this.deleted(); },
			export: () => { return this.deleted(); },
			import: (obj : boolean) => { if (obj) { this.delete(); } },
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

		game.entities().unregisterEntity(this.id());
	}

	type() : EntityType { return this._type; }
	allTypes() : Set<EntityType> { return this._allTypes; }
	id() : number { return this._id; }

	hasClientId() : boolean { return defined(this._clientId); }
	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this.hasClientId() && this.clientId() === game.id() }

	hasLevelVersion() : boolean { return defined(this._levelVersion); }
	levelVersion() : number { return this._levelVersion; }

	addEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [Entity, boolean] {
		return game.entities().addEntity(type, options);
	}
	addTrackedEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [Entity, boolean] {
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

	setTTL(ttl : number) : void {
		const timer = this.newTimer();
		timer.start(ttl, () => { this.delete(); });
	}

	takeDamage(amount : number, from? : Entity) : void {
		if (!this.hasComponent(ComponentType.HEALTH)) { return; }

		this.getComponent<Health>(ComponentType.HEALTH).damage(amount, from);
	}
	collide(collision : MATTER.Collision, other : Entity) : void {}
}