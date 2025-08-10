import * as MATTER from 'matter-js'

import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { SoundType, StatType } from 'game/factory/api'
import { SoundFactory } from 'game/factory/sound_factory'

import { Fns } from 'util/fns'
import { Vec2 } from 'util/vector'

export abstract class Projectile extends EntityBase {

	protected _collisions : Array<[MATTER.Collision, Entity]>;
	protected _damageMultiplier : number;
	protected _hitId : number;
	protected _hits : Set<number>;
	protected _prevPos : Vec2;
	protected _snapOnHit : boolean;
	protected _playImpactSound : boolean;

	protected _association : Association;
	protected _attributes : Attributes;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.PROJECTILE);

		this._collisions = new Array();
		this._damageMultiplier = 1;
		this._hitId = 0;
		this._hits = new Set();
		this._prevPos = Vec2.zero();
		this._snapOnHit = true;
		this._playImpactSound = true;

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));

		this.addProp<number>({
			has: () => { return this._hitId !== 0; },
			export: () => { return this._hitId; },
			import: (obj : number) => {
				const [other, hasOther] = game.entities().getEntity(obj);
				
				if (hasOther && !this._hits.has(other.id())) {
					this.onHit(other);
				}
			},
		});
	}

	override ready() : boolean {
		return super.ready() && this._association.hasRefreshedOwner();
	}

	override initialize() : void {
		super.initialize();

		const owner = this.owner();
		if (owner.hasStat(StatType.DAMAGE_BOOST)) {
			this._damageMultiplier *= owner.getStat(StatType.DAMAGE_BOOST);
		}

		if (this.isSource()) {
			if (owner.rollStat(StatType.CRIT_CHANCE)) {
				this.setAttribute(AttributeType.CRITICAL, true);
				this._damageMultiplier *= owner.getStat(StatType.CRIT_BOOST);

				const critChance = owner.getStat(StatType.CRIT_CHANCE);
				if (critChance > 1) {
					this._damageMultiplier *= critChance;
				}
			}
		}

		if (this.hasProfile() && owner.hasStat(StatType.SCALING)) {
			this.profile().multScaling(Math.max(0.1, owner.getStat(StatType.SCALING)));
		}
	}

	override delete() : void {
		super.delete();

		if (this.initialized()) {
			if (this._hits.size === 0) {
				this.onMiss();
			} else if (this.ttlElapsed() >= 1) {
				this.onExpire();
			}
		}
	}

	setSnapOnHit(snap : boolean) : void { this._snapOnHit = snap; }
	setPlayImpactSound(play : boolean) : void { this._playImpactSound = play; }

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		if (this.hasProfile()) {
			this._prevPos.copyVec(this.profile().pos())
		}
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this.canHit(collision, other)) {
			this._collisions.push([collision, other]);
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		if (this._collisions.length === 0) {
			return;
		}

		if (this._collisions.length === 1) {
			this.hit(this._collisions[0][0], this._collisions[0][1]);
			return;
		}

		let bestDot = 0;
		let firstCollision = null;
		for (let i = 0; i < this._collisions.length; ++i) {
			const collision = this._collisions[i];
			const dot = Math.abs(Vec2.fromVec(collision[0].penetration).dot(this.profile().vel()));
 
 			// Pick first collision
			if (firstCollision === null) {
				bestDot = dot;
				firstCollision = collision;
			} else if (bestDot > 0) {
				// Projectile went past object
				if (dot > bestDot) {
					bestDot = dot;
					firstCollision = collision;	
				}
			} else {
				if (dot < bestDot) {
					bestDot = dot;
					firstCollision = collision;
				}
			}
		}

		if (firstCollision !== null) {
			this.hit(firstCollision[0], firstCollision[1]);
		}

		this._collisions = [];
	}

	hits() : Set<number> { return this._hits; }

	protected canHit(collision : MATTER.Collision, other : Entity) : boolean {
		if (this._hits.has(other.id())) {
			return false;
		}
		if (this.matchAssociations([AssociationType.OWNER], other)) {
			return false;
		}
		return true;
	}
	protected hit(collision : MATTER.Collision, other : Entity) : void {
		if (other.getAttribute(AttributeType.INVINCIBLE) || other.getAttribute(AttributeType.DODGY)) {
			this._hits.add(other.id());
			return;
		}

		if (this._snapOnHit && this.hasProfile()) {
			// Snap to bounds
			if (other.allTypes().has(EntityType.BOUND)) {
				this.profile().snapTo(other.profile(), /*limit=*/1);

				// Little hack to snap explosion to right spot
				this._prevPos.copyVec(this.profile().pos());
			}
		}

		const hitDamage = this.hitDamage();
		if (hitDamage !== 0) {
			other.takeDamage(hitDamage, this.hasOwner() ? this.owner() : this);
		}

		if (!this._hits.has(other.id())) {
			this.onHit(other);
		}
	}

	protected explode(type : EntityType, entityOptions? : EntityOptions) : void {
		if (!this.hasProfile() || !this.profile().initialized()) {
			return;
		}

		this.addEntity(type, {
			profileInit: {
				pos: this._prevPos.lerp(this.profile().pos(), 0.5),
			},
			...entityOptions,
		});
	}

	hitDamage() : number {
		let damage = this.getStat(StatType.DAMAGE) * this._damageMultiplier;
		if (this.hasOwner()) {
			if (this.owner().hasStat(StatType.DAMAGE_CLOSE_BOOST)) {
				const weight = Math.max(0, 1 - 2 * this.ttlElapsed());
				damage *= Fns.normalizeRange(1, weight, this.owner().getStat(StatType.DAMAGE_CLOSE_BOOST));
			}
			if (this.owner().hasStat(StatType.DAMAGE_FAR_BOOST)) {
				const weight = Math.max(0, 2 * this.ttlElapsed() - 1);
				damage *= Fns.normalizeRange(1, weight, this.owner().getStat(StatType.DAMAGE_FAR_BOOST));
			}
		}
		return damage;
	}
	unstickDamage() : number {
		return this.getStat(StatType.UNSTICK_DAMAGE) * this._damageMultiplier;
	}
	applyUnstickDamage(id : number) : void {
		const dmg = this.unstickDamage();
		if (dmg === 0) {
			return;
		}

		const [parent, ok] = game.entities().getEntity(id);
		if (ok) {
			parent.takeDamage(dmg, this.hasOwner() ? this.owner() : this);
		}
	}
	onHit(other : Entity) : void {
		this._hits.add(other.id());

		if (this._hitId !== 0 || !this.initialized()) {
			return;
		}

		this._hitId = other.id();
		if (this._playImpactSound && other.impactSound() !== SoundType.UNKNOWN) {
			SoundFactory.playFromPos(other.impactSound(), this.profile().getRenderPos().toBabylon3(), {});		
		}
	}
	abstract onMiss() : void;
	onExpire() : void { this.onMiss(); }
}