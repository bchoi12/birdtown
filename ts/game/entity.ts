import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Component } from 'game/component'
import { AssociationType, AttributeType, ComponentType, StatType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { GameObject, GameObjectBase } from 'game/game_object'
import { Association, AssociationInitOptions } from 'game/component/association'
import { Attributes, AttributesInitOptions } from 'game/component/attributes'
import { CardinalsInitOptions } from 'game/component/cardinals'
import { HexColorsInitOptions } from 'game/component/hex_colors'
import { ProfileInitOptions } from 'game/component/profile'
import { Stats } from 'game/component/stats'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'

import { CounterType, KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { InterruptType } from 'util/timer'
import { Vec2 } from 'util/vector'

export type EntityOptions = {
	id? : number;
	clientId? : number;
	offline? : boolean;
	levelVersion? : number;

	associationInit? : AssociationInitOptions;
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

	addComponent<T extends Component>(component : T) : T;
	hasComponent(type : ComponentType) : boolean;
	getComponent<T extends Component>(type : ComponentType) : T;

	// Methods spanning components
	getCounts() : Map<CounterType, number>;
	setTTL(ttl : number, onDelete? : () => void);

	// Convenience getters/setters
	hasModel() : boolean;
	getModel() : Model;
	hasProfile() : boolean;
	getProfile() : Profile;
	getAttribute(type : AttributeType) : boolean;
	setAttribute(type : AttributeType, value : boolean) : void;

	// Match associations
	getAssociations() : Map<AssociationType, number>;
	matchAssociations(types : AssociationType[], other : Entity) : boolean;

	// Stats methods
	takeDamage(amount : number, from? : Entity) : void;

	// Profile methods
	collide(collision : MATTER.Collision, other : Entity) : void;
}

export interface EquipEntity extends Entity {
	equip(equip : Equip<Entity & EquipEntity>);
}

export abstract class EntityBase extends GameObjectBase implements Entity {
	protected _type : EntityType;
	protected _allTypes : Set<EntityType>;
	protected _id : number;
	protected _clientId : number;
	protected _levelVersion : number;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(EntityType[type].toLowerCase());

		if (!defined(entityOptions.id)) {
			console.error("Warning: entity type " + type + " has no id");
		}
		this.addNameParams({
			id: entityOptions.id,
		});

		this._type = type;
		this._allTypes = new Set();
		this._allTypes.add(type);

		if (entityOptions.offline) {
			this.setOffline(true);
			console.log(this.name());
		}
		if (entityOptions.levelVersion) {
			this._levelVersion = entityOptions.levelVersion;
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

		return this.matchAll((component : Component) => {
			return component.ready();
		});
	}

	override dispose() : void {
		super.dispose();

		if (!this.isOffline()) {
			game.entities().unregisterEntity(this.id());
		}
	}

	type() : EntityType { return this._type; }
	addType(type : EntityType) { this._allTypes.add(type); }
	allTypes() : Set<EntityType> { return this._allTypes; }
	id() : number { return this._id; }

	hasClientId() : boolean { return defined(this._clientId); }
	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this.hasClientId() && this.clientId() === game.clientId() }

	hasLevelVersion() : boolean { return defined(this._levelVersion); }
	levelVersion() : number { return this.hasLevelVersion() ? this._levelVersion : 0; }

	addEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [T, boolean] {
		if (this.hasLevelVersion()) {
			options = {...options, levelVersion: this.levelVersion() };
		}
		return game.entities().addEntity(type, options);
	}

	addComponent<T extends Component>(component : T) : T {
		component.setEntity(this);
		return this.registerChild<T>(component.type(), component);
	}
	hasComponent(type : ComponentType) : boolean { return this.hasChild(type); }
	getComponent<T extends Component>(type : ComponentType) : T { return this.getChild<T>(type); }

	getCounts() : Map<CounterType, number> { return new Map(); }
	setTTL(ttl : number, onDelete? : () => void) : void {
		const timer = this.newTimer({
			interrupt: InterruptType.UNSTOPPABLE,
		});
		timer.start(ttl, () => {
			if (onDelete) {
				onDelete();
			}
			this.delete();
		});
	}

	key(type : KeyType, state : KeyState) : boolean {
		if (this.state() === GameObjectState.DISABLE_INPUT) {
			return false;
		}

		const clientId = this.hasClientId() ? this.clientId() : game.clientId();
		if (!game.input().hasKeys(clientId)) {
			return false;
		}

		const keys = game.keys(clientId);
		return keys.getKey(type).keyState() === state;
	}
	inputDir() : Vec2 {
		const clientId = this.hasClientId() ? this.clientId() : game.clientId();
		if (!game.input().hasKeys(clientId)) {
			return Vec2.i();
		}

		return game.keys(clientId).dir();
	}
	inputMouse() : Vec2 {
		const clientId = this.hasClientId() ? this.clientId() : game.clientId();
		if (!game.input().hasKeys(clientId)) {
			return Vec2.i();
		}
		return game.keys(clientId).mouse();
	}

	getAssociations() : Map<AssociationType, number> {
		let associations : Map<AssociationType, number>;
		if (!this.hasComponent(ComponentType.ASSOCIATION)) {
			associations = new Map();
		} else {
			associations = this.getComponent<Association>(ComponentType.ASSOCIATION).toMap();
		}
		if (!associations.has(AssociationType.OWNER)) {
			associations.set(AssociationType.OWNER, this.id());
		}
		return associations;
	}
	// TODO: make this more flexible than match any
	matchAssociations(types : AssociationType[], other : Entity) : boolean {
		const association = this.getAssociations();
		const otherAssociation = other.getAssociations();

		for (let type of types) {
			if (!association.has(type) || !otherAssociation.has(type)) { continue; }

			if (association.get(type) === otherAssociation.get(type)) { return true; }
		}

		return false;
	}

	hasModel() : boolean { return this.hasComponent(ComponentType.MODEL); }
	getModel() : Model { return this.getComponent<Model>(ComponentType.MODEL); }
	hasProfile() : boolean { return this.hasComponent(ComponentType.PROFILE); }
	getProfile() : Profile { return this.getComponent<Profile>(ComponentType.PROFILE); }

	getAttribute(type : AttributeType) : boolean {
		if (!this.hasComponent(ComponentType.ATTRIBUTES)) { return false; }

		const attributes = this.getComponent<Attributes>(ComponentType.ATTRIBUTES);
		return attributes.hasAttribute(type) && attributes.getAttribute(type);
	}
	setAttribute(type : AttributeType, value : boolean) : void {
		if (!this.hasComponent(ComponentType.ATTRIBUTES)) { return; }

		let attributes = this.getComponent<Attributes>(ComponentType.ATTRIBUTES);
		attributes.setAttribute(type, value);
	}

	takeDamage(amount : number, from? : Entity) : void {
		if (!this.hasComponent(ComponentType.STATS)) { return; }
		this.getComponent<Stats>(ComponentType.STATS).updateStat(StatType.HEALTH, {
			amount: -amount,
			...from && { from: from },
		});
	}
	collide(collision : MATTER.Collision, other : Entity) : void {}
}