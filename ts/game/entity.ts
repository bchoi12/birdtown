import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Component } from 'game/component'
import { AssociationType, AttributeType, ComponentType, StatType } from 'game/component/api'
import { Association, AssociationInitOptions } from 'game/component/association'
import { Attributes, AttributesInitOptions } from 'game/component/attributes'
import { CardinalsInitOptions } from 'game/component/cardinals'
import { HexColorsInitOptions } from 'game/component/hex_colors'
import { Model, ModelInitOptions } from 'game/component/model'
import { Profile, ProfileInitOptions } from 'game/component/profile'
import { SoundPlayer } from 'game/component/sound_player'
import { Stat, StatInitOptions } from 'game/component/stat'
import { Stats } from 'game/component/stats'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { GameObject, GameObjectBase, StepData } from 'game/game_object'
import { SoundType } from 'game/factory/api'

import { StringFactory } from 'strings/string_factory'
import { ParamString } from 'strings/param_string'

import { HudType, HudOptions, KeyType, KeyState, TooltipType } from 'ui/api'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { Timer } from 'util/timer'
import { Vec, Vec2, Vec3 } from 'util/vector'

export type EntityOptions = {
	id? : number;
	clientId? : number;
	offline? : boolean;
	levelVersion? : number;
	ttl? : number;

	associationInit? : AssociationInitOptions;
	attributesInit? : AttributesInitOptions;
	cardinalsInit? : CardinalsInitOptions;
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
	getHudData() : Map<HudType, HudOptions>;
	setTTL(ttl : number, onDelete? : () => void);
	ttlElapsed() : number;
	ttlMillisElapsed() : number;
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
	soundPlayer() : SoundPlayer;

	// Match associations
	getAssociations() : Map<AssociationType, number>;
	matchAssociations(types : AssociationType[], other : Entity) : boolean;

	addForce(force : Vec) : void;
	takeDamage(amount : number, from : Entity) : void;

	// Profile methods
	collide(collision : MATTER.Collision, other : Entity) : void;

	// Sound playback rate
	playbackRate() : number;
	impactSound() : SoundType;

	// For UI
	displayName() : string;
	clientColorOr(color : string) : string;
}

export interface EquipEntity extends Entity {
	equip(equip : Equip<Entity & EquipEntity>) : void;
}

export interface InteractEntity extends Entity {
	setInteractableWith(entity : Entity, interactable : boolean) : void;
	canInteractWith(entity : Entity) : boolean;
	interactWith(entity : Entity) : void;
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

	override dispose() : void {
		super.dispose();

		game.entities().unregisterEntity(this.id());
	}

	id() : number { return this._id; }
	hasClientId() : boolean { return this._clientId > 0; }
	clientId() : number { return this._clientId; }
	clientIdMatches() : boolean { return this.hasClientId() && this.clientId() === game.clientId() }
	isLakituTarget() : boolean { return game.lakitu().hasTargetEntity() && this._id === game.lakitu().targetEntity().id(); }
	displayName() : string {
		if (game.tablets().hasTablet(this.clientId())) {
			return game.tablet(this.clientId()).displayName();
		}
		return EntityType[this._type].toLowerCase();
	}

	type() : EntityType { return this._type; }
	addType(type : EntityType) { this._allTypes.add(type); }
	allTypes() : Set<EntityType> { return this._allTypes; }

	hasLevelVersion() : boolean { return this._levelVersion > 0; }
	levelVersion() : number { return this.hasLevelVersion() ? this._levelVersion : 0; }

	addEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [T, boolean] {
		if (!this.isSource() && !options.offline) {
			return [null, false];
		}

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

	getHudData() : Map<HudType, HudOptions> { return new Map(); }
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
	ttlMillisElapsed() : number { return this._ttlTimer.has() ? this._ttlTimer.get().millisElapsed() : 0; }

	key(type : KeyType, state : KeyState) : boolean {
		if (this.state() === GameObjectState.DISABLE_INPUT) {
			return false;
		}

		const clientId = this.hasClientId() ? this.clientId() : game.clientId();
		if (!game.input().hasKeys(clientId)) {
			return false;
		}

		const keys = game.keys(clientId);
		return keys.getKey(type).checkState(state);
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
		if (!this.hasComponent(ComponentType.ASSOCIATION)) {
			return false;
		}

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
	soundPlayer() : SoundPlayer {
		if (!this.hasComponent(ComponentType.SOUND_PLAYER)) {
			this.addComponent(new SoundPlayer());
		}
		return this.getComponent<SoundPlayer>(ComponentType.SOUND_PLAYER);
	}

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
			console.error("Warning: tried to set %s to %d for %s which has no attribute component", AttributeType[type], value, this.name());
			return;
		}

		this.getComponent<Attributes>(ComponentType.ATTRIBUTES).setAttribute(type, value);
	}

	addForce(force : Vec) : void {
		if (!this.hasProfile()) {
			return;
		}

		this.profile().addForce(force);
	}
	takeDamage(delta : number, from? : Entity) : void {
		if (!this.hasComponent(ComponentType.STATS)) { return; }

		if (delta >= 0 && this.getAttribute(AttributeType.INVINCIBLE)) {
			return;
		}

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

	playbackRate() : number { return 1; }
	impactSound() : SoundType { return SoundType.UNKNOWN; }
	clientColorOr(or : string) : string {
		if (this.hasClientId() && game.tablets().hasTablet(this.clientId())) {
			return game.tablet(this.clientId()).color();
		}
		return or;
	}
}