import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Component } from 'game/component'
import { AssociationType, AttributeType, ComponentType, CounterType, StatType } from 'game/component/api'
import { Association, AssociationInitOptions } from 'game/component/association'
import { Attributes, AttributesInitOptions } from 'game/component/attributes'
import { CardinalsInitOptions } from 'game/component/cardinals'
import { Counters, CountersInitOptions } from 'game/component/counters'
import { HexColorsInitOptions } from 'game/component/hex_colors'
import { Model, ModelInitOptions } from 'game/component/model'
import { Profile, ProfileInitOptions } from 'game/component/profile'
import { Stats } from 'game/component/stats'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { GameObject, GameObjectBase, StepData } from 'game/game_object'

import { StringFactory } from 'strings/string_factory'
import { ParamString } from 'strings/param_string'

import { KeyType, KeyState, TooltipType } from 'ui/api'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { Timer } from 'util/timer'
import { Vec2, Vec3 } from 'util/vector'

export type EntityOptions = {
	id? : number;
	clientId? : number;
	offline? : boolean;
	levelVersion? : number;
	ttl? : number;

	associationInit? : AssociationInitOptions;
	attributesInit? : AttributesInitOptions;
	cardinalsInit? : CardinalsInitOptions;
	countersInit? : CountersInitOptions;
	hexColorsInit? : HexColorsInitOptions;
	modelInit? : ModelInitOptions;
	profileInit? : ProfileInitOptions
}

export interface Entity extends GameObject {
	type() : EntityType;
	allTypes() : Set<EntityType>;
	id() : number;

	hasClientId() : boolean;
	clientId() : number;
	clientIdMatches() : boolean;
	isLakituTarget() : boolean;

	hasLevelVersion() : boolean;
	levelVersion() : number;

	addEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [T, boolean];

	addComponent<T extends Component>(component : T) : T;
	hasComponent(type : ComponentType) : boolean;
	getComponent<T extends Component>(type : ComponentType) : T;

	// Methods spanning components
	getCounts() : Map<CounterType, number>;
	setTTL(ttl : number, onDelete? : () => void);
	ttlElapsed() : number;
	key(type : KeyType, state : KeyState) : boolean;
	inputDir() : Vec2;
	inputMouse() : Vec2;
	cameraOffset() : Vec3;

	// Convenience getters/setters
	hasModel() : boolean;
	model() : Model;
	hasProfile() : boolean;
	profile() : Profile;
	hasAttribute(type : AttributeType) : boolean;
	getAttribute(type : AttributeType) : boolean;
	setAttribute(type : AttributeType, value : boolean) : void;
	attributeLastChange(type : AttributeType) : Optional<number>;
	getCounter(type : CounterType) : number;
	addCounter(type : CounterType, value : number) : void;
	setCounter(type : CounterType, value : number) : void;

	// Match associations
	getAssociations() : Map<AssociationType, number>;
	matchAssociations(types : AssociationType[], other : Entity) : boolean;

	// Stats methods
	takeDamage(amount : number, from : Entity) : void;

	// Profile methods
	collide(collision : MATTER.Collision, other : Entity) : void;
}

export interface EquipEntity {
	equip(equip : Equip<Entity & EquipEntity>) : void;
}

export abstract class EntityBase extends GameObjectBase implements Entity {

	protected _id : number;
	protected _clientId : number;

	protected _type : EntityType;
	protected _allTypes : Set<EntityType>;
	protected _entityName : ParamString;
	protected _ttlTimer : Optional<Timer>;

	protected _levelVersion : number;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(EntityType[type].toLowerCase());

		if (!entityOptions.id) {
			console.error("Warning: created entity with invalid id:", this.name());
		}
		this._id = entityOptions.id ? entityOptions.id : 0;
		this._clientId = entityOptions.clientId ? entityOptions.clientId : 0;

		this.addNameParams({
			id: this._id,
		});

		this._type = type;
		this._allTypes = new Set();
		this._allTypes.add(type);
		this._entityName = StringFactory.getEntityName(this);
		this._ttlTimer = new Optional();

		if (entityOptions.offline) {
			this.setOffline(true);
		}
		if (entityOptions.levelVersion) {
			this._levelVersion = entityOptions.levelVersion;
		}
		if (entityOptions.ttl) {
			this.setTTL(entityOptions.ttl);
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

		this.maybePrintUnready();

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

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		if (this.hasAttribute(AttributeType.OCCLUDED)) {
			this.setAttribute(AttributeType.OCCLUDED, false);
		}
	}

	id() : number { return this._id; }
	hasClientId() : boolean { return this._clientId > 0; }
	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this.hasClientId() && this.clientId() === game.clientId() }
	isLakituTarget() : boolean { return game.lakitu().hasTargetEntity() && this._id === game.lakitu().targetEntity().id(); }

	type() : EntityType { return this._type; }
	addType(type : EntityType) { this._allTypes.add(type); }
	allTypes() : Set<EntityType> { return this._allTypes; }

	hasLevelVersion() : boolean { return this._levelVersion > 0; }
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
		if (!this._ttlTimer.has()) {
			this._ttlTimer.set(this.newTimer({
				canInterrupt: true,
			}));
		}

		this._ttlTimer.get().start(ttl, () => {
			if (onDelete) {
				onDelete();
			}
			this.delete();
		});
	}
	ttlElapsed() : number { return this._ttlTimer.has() ? this._ttlTimer.get().percentElapsed() : 0; }

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
	cameraOffset() : Vec3 {
		return Vec3.zero();
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
	model() : Model { return this.getComponent<Model>(ComponentType.MODEL); }
	hasProfile() : boolean { return this.hasComponent(ComponentType.PROFILE); }
	profile() : Profile { return this.getComponent<Profile>(ComponentType.PROFILE); }

	hasAttribute(type : AttributeType) : boolean {
		if (!this.hasComponent(ComponentType.ATTRIBUTES)) { return false; }

		return this.getComponent<Attributes>(ComponentType.ATTRIBUTES).hasAttribute(type);
	}
	getAttribute(type : AttributeType) : boolean {
		if (!this.hasComponent(ComponentType.ATTRIBUTES)) { return false; }

		return this.getComponent<Attributes>(ComponentType.ATTRIBUTES).getAttribute(type);
	}
	setAttribute(type : AttributeType, value : boolean) : void {
		if (!this.hasComponent(ComponentType.ATTRIBUTES)) {
			return;
		}

		this.getComponent<Attributes>(ComponentType.ATTRIBUTES).setAttribute(type, value);
	}
	attributeLastChange(type : AttributeType) : Optional<number> {
		if (!this.hasComponent(ComponentType.ATTRIBUTES)) {
			return Optional.empty();
		}
		return this.getComponent<Attributes>(ComponentType.ATTRIBUTES).lastChange(type);
	}

	getCounter(type : CounterType) : number {
		if (!this.hasComponent(ComponentType.COUNTERS)) { return 0; }

		return this.getComponent<Counters>(ComponentType.COUNTERS).getCounter(type);
	}
	addCounter(type : CounterType, value : number) : void {
		if (!this.hasComponent(ComponentType.COUNTERS)) {
			console.error("Warning: %s missing Counters component", this.name());
			return;
		}

		this.getComponent<Counters>(ComponentType.COUNTERS).addCounter(type, value);		
	}
	setCounter(type : CounterType, value : number) : void {
		if (!this.hasComponent(ComponentType.COUNTERS)) {
			console.error("Warning: %s missing Counters component", this.name());
			return;
		}

		this.getComponent<Counters>(ComponentType.COUNTERS).setCounter(type, value);	
	}

	takeDamage(delta : number, from? : Entity) : void {
		if (!this.hasComponent(ComponentType.STATS)) { return; }

		this.getComponent<Stats>(ComponentType.STATS).updateStat(StatType.HEALTH, {
			delta: -delta,
			entity: from,
		});
	}
	collide(collision : MATTER.Collision, other : Entity) : void {
		if (this.hasProfile()) {
			this.profile().collide(collision, other);
		}
	}
}