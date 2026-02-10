import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Component } from 'game/component'
import { ComponentType, AssociationType, AttributeType, EmotionType, TeamType, TraitType } from 'game/component/api'
import { Association, AssociationInitOptions } from 'game/component/association'
import { Attributes, AttributesInitOptions } from 'game/component/attributes'
import { Buffs } from 'game/component/buffs'
import { CardinalsInitOptions } from 'game/component/cardinals'
import { Expression } from 'game/component/expression'
import { HexColorsInitOptions } from 'game/component/hex_colors'
import { Model, ModelInitOptions } from 'game/component/model'
import { Profile, ProfileInitOptions } from 'game/component/profile'
import { Traits, TraitsInitOptions } from 'game/component/traits'
import { SoundPlayer } from 'game/component/sound_player'
import { Resources } from 'game/component/resources'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { GameObject, GameObjectBase, StepData } from 'game/game_object'
import { BuffType, StatType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StatFactory } from 'game/factory/stat_factory'

import { Flags } from 'global/flags'

import { StringFactory } from 'strings/string_factory'
import { ParamString } from 'strings/param_string'

import { HudType, HudOptions, KeyType, KeyState, TooltipType } from 'ui/api'

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { Timer } from 'util/timer'
import { Vec, Vec2, Vec3 } from 'util/vector'

export type EntityOptions = {
	id? : number;
	clientId? : number;
	offline? : boolean;
	levelVersion? : number;
	seed? : number;
	ttl? : number;

	associationInit? : AssociationInitOptions;
	attributesInit? : AttributesInitOptions;
	cardinalsInit? : CardinalsInitOptions;
	hexColorsInit? : HexColorsInitOptions;
	modelInit? : ModelInitOptions;
	profileInit? : ProfileInitOptions
	traitsInit? : TraitsInitOptions;
}

export interface Entity extends GameObject {
	type() : EntityType;
	allTypes() : Set<EntityType>;
	parentType() : EntityType;
	hasType(type : EntityType) : boolean;
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
	setTTL(ttl : number, onDelete? : () => void) : void;
	restartTTL() : void;
	ttlElapsed() : number;
	ttlMillisLeft() : number;
	key(type : KeyType, state : KeyState) : boolean;
	keyCounter(type : KeyType) : number;
	setInputDir(vec : Vec) : void;
	inputDir() : Vec2;
	cameraOffset() : Vec3;

	// Convenience getters/setters
	hasModel() : boolean;
	model() : Model;
	hasProfile() : boolean;
	profile() : Profile;
	hasAttribute(type : AttributeType) : boolean;
	getAttribute(type : AttributeType) : boolean;
	setAttribute(type : AttributeType, value : boolean) : void;
	hasTrait(type : TraitType) : boolean;
	getTrait(type : TraitType) : number;
	getTraitWeight(type : TraitType) : number;
	randTrait(type : TraitType) : number;
	rollTrait(type : TraitType, value : number) : boolean;
	hasStat(type : StatType) : boolean;
	baseStat(type : StatType) : number;
	getStat(type : StatType) : number;
	getStatOr(type : StatType, or : number) : number;
	rollStat(type : StatType) : boolean;
	hasBuff(type : BuffType) : boolean;
	hasMaxedBuff(type : BuffType) : boolean;
	addBuff(type : BuffType, delta : number) : void;
	buffLevel(type : BuffType) : number;
	levelUp() : void;
	setBuffMin(type : BuffType, min : number) : void;
	removeBuff(type : BuffType) : void;
	clearBuffs() : void;

	soundPlayer() : SoundPlayer;

	// Associations
	getAssociations() : Map<AssociationType, number>;
	setOwner(id : number) : void;
	setTeam(team : TeamType) : void;
	sameTeam(other : Entity) : boolean;
	team() : TeamType;
	hasOwner() : boolean;
	owner() : Entity;
	sameOwner(other : Entity) : boolean;

	addForce(force : Vec) : void;
	resetResource(type : StatType) : void;
	shield() : number;
	addShield(amount : number) : void;
	heal(amount : number) : void;
	health() : number;
	maxHealth() : number;
	healthPercent() : number;
	takeDamage(amount : number, from? : Entity, hitEntity? : Entity) : void;
	emote(type : EmotionType, value? : number) : void;
	dead() : boolean;

	// Profile methods
	collide(collision : MATTER.Collision, other : Entity) : void;

	// Sound playback rate
	playbackRate() : number;
	impactSound() : SoundType;

	// For UI
	displayName() : string;
	clientColor() : string;
	fallbackColor() : string;
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
	protected _orderedTypes : Array<EntityType>;
	protected _entityName : ParamString;
	protected _ttlTimer : Optional<Timer>;
	protected _inputDir : Vec2;

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
		this._orderedTypes = new Array();
		this.addType(type);
		this._entityName = StringFactory.getEntityName(this);
		this._ttlTimer = new Optional();
		this._inputDir = Vec2.i();

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
	addType(type : EntityType) {
		this._orderedTypes.push(type);
		this._allTypes.add(type);
	}
	allTypes() : Set<EntityType> { return this._allTypes; }
	parentType() : EntityType {
		// Order is [type(), broadest, ..., parent]
		if (this._orderedTypes.length >= 2) {
			return this._orderedTypes[this._orderedTypes.length - 1];
		}
		return EntityType.UNKNOWN;
	}
	hasType(type : EntityType) : boolean { return this._allTypes.has(type); }

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
	restartTTL() : void {
		if (this._ttlTimer.has()) {
			this._ttlTimer.get().restart();
		}
	}
	setTTL(ttl : number, onDelete? : () => void) : void {
		if (!this._ttlTimer.has()) {
			this._ttlTimer.set(this.newTimer({
				canInterrupt: true,
			}));
		}

		this._ttlTimer.get().timeout(ttl, () => {
			if (onDelete) {
				onDelete();
			}
			this.delete();
		});
	}
	ttlElapsed() : number { return this._ttlTimer.has() ? this._ttlTimer.get().percentElapsed() : 0; }
	ttlMillisLeft() : number { return this._ttlTimer.has() ? this._ttlTimer.get().millisLeft() : 0; }

	key(type : KeyType, state : KeyState) : boolean {
		if (this.state() === GameObjectState.DISABLE_INPUT) {
			return false;
		}

		const clientId = this.hasClientId() ? this.clientId() : game.clientId();
		if (!game.input().hasKeys(clientId)) {
			return false;
		}

		const keys = game.keys(clientId);
		return keys.key(type).checkState(state);
	}
	keyCounter(type : KeyType) : number {
		const clientId = this.hasClientId() ? this.clientId() : game.clientId();
		if (!game.input().hasKeys(clientId)) {
			return 0;
		}

		const keys = game.keys(clientId);
		return keys.key(type).counter();
	}
	setInputDir(vec : Vec) : void { this._inputDir.copyVec(vec); }
	inputDir() : Vec2 {
		if (!this.hasClientId() || !game.input().hasKeys(this.clientId())) {
			return this._inputDir;
		}

		return game.keys(this.clientId()).dir();
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
	setOwner(id : number) : void {
		if (!this.hasComponent(ComponentType.ASSOCIATION)) {
			console.error("Error: cannot set owner for %s which has no Association component", this.name());
			return;
		}

		let association = this.getComponent<Association>(ComponentType.ASSOCIATION);
		association.setOwner(id);
	}
	setTeam(team : TeamType) : void {
		if (!this.hasComponent(ComponentType.ASSOCIATION)) {
			console.error("Error: cannot set team for %s which has no Association component", this.name());
			return;
		}

		let association = this.getComponent<Association>(ComponentType.ASSOCIATION);
		association.setTeam(team);
	}
	sameTeam(other : Entity) : boolean {
		return this.matchAssociations([AssociationType.TEAM], other);
	}
	team() : TeamType {
		if (!this.hasComponent(ComponentType.ASSOCIATION)) {
			return TeamType.UNKNOWN;
		}

		return this.getComponent<Association>(ComponentType.ASSOCIATION).getAssociation(AssociationType.TEAM);
	}
	hasOwner() : boolean {
		if (!this.hasComponent(ComponentType.ASSOCIATION)) {
			return false;
		}
		return this.getComponent<Association>(ComponentType.ASSOCIATION).hasOwner();
	}
	sameOwner(other : Entity) : boolean {
		return this.matchAssociations([AssociationType.OWNER], other);
	}
	owner() : Entity {
		if (!this.hasComponent(ComponentType.ASSOCIATION)) {
			console.error("Error: queried owner for %s", this.name());
			return null;
		}
		return this.getComponent<Association>(ComponentType.ASSOCIATION).owner();
	}
	private matchAssociations(types : AssociationType[], other : Entity) : boolean {
		if (!this.hasComponent(ComponentType.ASSOCIATION)) {
			return false;
		}

		const association = this.getAssociations();
		const otherAssociation = other.getAssociations();

		for (let type of types) {
			if (!association.has(type) || !otherAssociation.has(type)) { continue; }
			if (association.get(type) === 0) { continue; }
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

	hasTrait(type : TraitType) : boolean { 
		return this.hasComponent(ComponentType.TRAITS) && this.getComponent<Traits>(ComponentType.TRAITS).hasTrait(type);
	}
	getTrait(type : TraitType) : number {
		if (!this.hasComponent(ComponentType.TRAITS)) {
			return 0;
		}

		return this.getComponent<Traits>(ComponentType.TRAITS).getTrait(type);
	}
	getTraitWeight(type : TraitType) : number {
		return Fns.normalizeRange(0, this.getTrait(type), 100);
	}
	randTrait(type : TraitType) : number {
		if (!this.hasComponent(ComponentType.TRAITS)) {
			return 0;
		}

		return this.getComponent<Traits>(ComponentType.TRAITS).rand(type);
	}
	rollTrait(type : TraitType, value : number) : boolean {
		if (!this.hasComponent(ComponentType.TRAITS)) {
			return false;
		}

		return this.getComponent<Traits>(ComponentType.TRAITS).roll(type, value);
	}

	hasStat(type : StatType) : boolean {
		return StatFactory.has(this, type);
	}
	baseStat(type : StatType) : number {
		return StatFactory.base(this, type);
	}
	getStat(type : StatType) : number {
		let stat = this.baseStat(type);
		if (this.hasComponent(ComponentType.BUFFS)) {
			return StatFactory.clamp(type, stat + this.getComponent<Buffs>(ComponentType.BUFFS).getBoost(type));
		}
		return stat;
	}
	getStatOr(type : StatType, or : number) : number {
		if (!this.hasStat(type)) {
			return or;
		}
		return this.getStat(type);
	}
	rollStat(type : StatType) : boolean {
		if (!this.hasStat(type)) {
			return false;
		}
		return this.getStat(type) > Math.random();
	}
	hasBuff(type : BuffType) : boolean {
		if (!this.hasComponent(ComponentType.BUFFS)) {
			return false;
		}
		return this.getComponent<Buffs>(ComponentType.BUFFS).hasBuff(type);
	}
	hasMaxedBuff(type : BuffType) : boolean {
		if (!this.hasComponent(ComponentType.BUFFS)) {
			return false;
		}
		return this.getComponent<Buffs>(ComponentType.BUFFS).hasMaxedBuff(type);
	}
	addBuff(type : BuffType, delta : number) : void {
		if (!this.isSource() || !this.hasComponent(ComponentType.BUFFS)) {
			return;
		}
		if (type === BuffType.UNKNOWN) {
			console.error("Warning: skipping adding unknown buff for %s", this.name());
			return;
		}
		if (delta === 0) {
			console.error("Warning: skipping buff delta of 0 for %s, %s", BuffType[type], this.name());
			return;
		}
		this.getComponent<Buffs>(ComponentType.BUFFS).addBuff(type, delta);
	}
	buffLevel(type : BuffType) : number {
		if (!this.hasComponent(ComponentType.BUFFS)) {
			return;
		}
		return this.getComponent<Buffs>(ComponentType.BUFFS).buffLevel(type);
	}
	levelUp() : void {
		if (!this.hasComponent(ComponentType.BUFFS)) {
			return;
		}
		this.getComponent<Buffs>(ComponentType.BUFFS).levelUp();
	}
	setBuffMin(type : BuffType, min : number) : void {
		if (!this.hasComponent(ComponentType.BUFFS)) {
			return;
		}
		this.getComponent<Buffs>(ComponentType.BUFFS).setBuffMin(type, min);
	}
	removeBuff(type : BuffType) : void {
		if (!this.hasComponent(ComponentType.BUFFS)) {
			return;
		}
		this.getComponent<Buffs>(ComponentType.BUFFS).removeBuff(type);
	}
	clearBuffs() : void {
		if (!this.hasComponent(ComponentType.BUFFS)) {
			return;
		}
		this.getComponent<Buffs>(ComponentType.BUFFS).clearBuffs();
	}

	addForce(force : Vec) : void {
		if (!this.hasProfile()) {
			return;
		}

		this.profile().addSourceForce(force);
	}

	resetResource(type : StatType) : void {
		if (!this.hasComponent(ComponentType.RESOURCES)) { return; }

		this.getComponent<Resources>(ComponentType.RESOURCES).resetResource(type);
	}
	shield() : number {
		if (!this.hasComponent(ComponentType.RESOURCES)) { return 0; }

		return this.getComponent<Resources>(ComponentType.RESOURCES).shield();	
	}
	addShield(delta : number) : void {
		if (!this.hasComponent(ComponentType.RESOURCES)) { return; }

		this.getComponent<Resources>(ComponentType.RESOURCES).updateResource(StatType.SHIELD, {
			delta: delta,
		});
	}
	heal(delta : number) : void {
		if (!this.hasComponent(ComponentType.RESOURCES)) { return; }

		if (this.dead() && !this.getAttribute(AttributeType.REVIVING)) {
			return;
		}

		this.getComponent<Resources>(ComponentType.RESOURCES).updateResource(StatType.HEALTH, {
			delta: delta,
		});
	}
	health() : number {
		if (!this.hasComponent(ComponentType.RESOURCES)) { return 0; }

		return this.getComponent<Resources>(ComponentType.RESOURCES).health();	
	}
	maxHealth() : number {
		if (!this.hasComponent(ComponentType.RESOURCES)) { return 0; }

		return this.getComponent<Resources>(ComponentType.RESOURCES).maxHealth();
	}
	healthPercent() : number {
		if (!this.hasComponent(ComponentType.RESOURCES)) { return 1; }

		return this.getComponent<Resources>(ComponentType.RESOURCES).healthPercent();
	}
	takeDamage(delta : number, from? : Entity, hitEntity? : Entity) : void {
		if (!this.isSource() || !this.hasComponent(ComponentType.RESOURCES)) { return; }

		if (delta >= 0 && (this.getAttribute(AttributeType.INVINCIBLE) || this.dead())) {
			return;
		}

		if (game.controller().config().hasDamageMultiplier()) {
			delta *= game.controller().config().getDamageMultiplier();;
		}


		if (delta > 0
			&& from
			&& this.id() !== from.id()
			&& !this.hasType(EntityType.BOT)
			&& this.sameTeam(from)) {

			if (from.hasStat(StatType.HEAL_PERCENT)) {
				this.heal(from.getStat(StatType.HEAL_PERCENT) * delta);
			}
			if (from.hasStat(StatType.IMBUE_LEVEL)) {
				const imbueLevel = from.getStat(StatType.IMBUE_LEVEL);

				if (imbueLevel > 0) {
					this.addBuff(BuffType.IMBUE, imbueLevel > this.buffLevel(BuffType.IMBUE) ? 1 : 0);
				}
			}

			const noDamage = from.hasBuff(BuffType.HEALER) || !game.controller().config().getFriendlyFireOr(false);
			if (noDamage) {
				return;
			}
		}

		// Damage stuff
		let resources = this.getComponent<Resources>(ComponentType.RESOURCES);
		delta = -delta;
		if (delta < 0 && from && this.id() !== from.id()) {
			let mult = 1 + from.getStat(StatType.DAMAGE_BOOST);
			mult += this.getStat(StatType.DAMAGE_TAKEN_BOOST) - this.getStat(StatType.DAMAGE_RESIST_BOOST);

			if (hitEntity && hitEntity.hasType(EntityType.PROJECTILE) && this.hasProfile() && from.hasProfile()) {
				if (from.hasStat(StatType.DAMAGE_FAR_BOOST)) {
					const distSq = game.level().distSq(this.profile(), from.profile());
					mult += Fns.normalizeRange(10 * 10, distSq, 20 * 20) * from.getStat(StatType.DAMAGE_FAR_BOOST);
				}
				if (from.hasStat(StatType.DAMAGE_CLOSE_BOOST)) {
					const dist = game.level().dist(this.profile(), from.profile());
					mult += Fns.normalizeRange(10, dist, 0) * from.getStat(StatType.DAMAGE_CLOSE_BOOST);
				}
			}
			delta *= Math.max(0.1, mult);

			delta -= Math.min(0, from.getStat(StatType.DAMAGE_ADDITION) - this.getStat(StatType.DAMAGE_REDUCTION));
			delta = Math.min(0, delta);

			let buffDelta = 1;
			if (this.shield() > 0) {
				delta = resources.updateResource(StatType.SHIELD, {
					delta: delta,
					from: from,
					hitEntity: hitEntity,
				});
			} else if (hitEntity && hitEntity.getAttribute(AttributeType.CRITICAL)) {
				delta *= 1 + from.getStat(StatType.CRIT_BOOST) + Math.max(0, from.getStat(StatType.CRIT_CHANCE) - 1);
				buffDelta = 2;
			}

			if (delta < 0) {
				if (from.hasStat(StatType.EXPOSE_PERCENT)) {
					const exposeDelta = Math.round(Math.abs(delta) * from.getStat(StatType.EXPOSE_PERCENT));
					if (exposeDelta > 0) {
						this.addBuff(BuffType.EXPOSE, exposeDelta);
					}
				}
				if (from.rollStat(StatType.SLOW_CHANCE)) {
					this.addBuff(BuffType.SLOW, buffDelta);
				}
				if (hitEntity && hitEntity.getAttribute(AttributeType.BURNING)) {
					this.addBuff(BuffType.FLAME, 2);
				}
				if (from.rollStat(StatType.FLAME_CHANCE)) {
					this.addBuff(BuffType.FLAME, buffDelta);
				}
				if (hitEntity && hitEntity.getAttribute(AttributeType.POISONING)) {
					this.addBuff(BuffType.POISON, 2);
				}
				if (from.rollStat(StatType.POISON_CHANCE)) {
					this.addBuff(BuffType.POISON, buffDelta);
				}
				if (this.getAttribute(AttributeType.LIVING) && !this.dead()) {
					if (from.hasStat(StatType.LIFE_STEAL)) {
						from.heal(from.getStat(StatType.LIFE_STEAL) * Math.abs(delta));
					}
					if (from.hasStat(StatType.SHIELD_STEAL)) {
						from.addShield(from.getStat(StatType.SHIELD_STEAL) * Math.abs(delta));
					}
					if (from.hasStat(StatType.HEALTH_ADDITION)) {
						from.heal(from.getStat(StatType.HEALTH_ADDITION) * buffDelta);
					}
				}
			}
		}

		resources.updateResource(StatType.HEALTH, {
			delta: delta,
			from: from,
			hitEntity : hitEntity,
		});
	}
	emote(type : EmotionType, value? : number) : void {
		if (!this.hasComponent(ComponentType.EXPRESSION)) {
			return;
		}

		this.getComponent<Expression>(ComponentType.EXPRESSION).emote(type, value ? value : 1);
	}
	dead() : boolean {
		if (!this.hasComponent(ComponentType.RESOURCES)) { return false; }

		return this.getComponent<Resources>(ComponentType.RESOURCES).dead();
	}

	collide(collision : MATTER.Collision, other : Entity) : void {
		if (this.hasProfile()) {
			this.profile().collide(collision, other);
		}
	}

	playbackRate() : number {
		if (this.hasOwner()) {
			return this.owner().playbackRate();
		}

		let rate = 1;
		if (this.getAttribute(AttributeType.UNDERWATER)) {
			rate *= 0.7;
		}
		if (this.hasProfile() && this.profile().hasScaling()) {
			const scaling = this.profile().scaling();
			rate /= (scaling.x + scaling.y) / 2;
		}
		return rate;
	}
	impactSound() : SoundType { return SoundType.UNKNOWN; }

	clientColor() : string {
		if (this.hasClientId() && game.tablets().hasTablet(this.clientId())) {
			return game.tablet(this.clientId()).color();
		}
		return this.fallbackColor();
	}
	fallbackColor() : string { return ColorFactory.lightGrayHex; }
}