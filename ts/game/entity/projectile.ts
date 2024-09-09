import * as MATTER from 'matter-js'

import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'

import { Vec2 } from 'util/vector'

export abstract class Projectile extends EntityBase {

	protected _collisions : Array<[MATTER.Collision, Entity]>;
	protected _hits : Set<number>;
	protected _prevPos : Vec2;

	protected _association : Association;
	protected _attributes : Attributes;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.PROJECTILE);

		this._collisions = new Array();
		this._hits = new Set();
		this._prevPos = Vec2.zero();

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
	}

	override ready() : boolean {
		return super.ready() && this._association.hasAssociation(AssociationType.OWNER);
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
		if (other.getAttribute(AttributeType.INVINCIBLE)) {
			return false;
		}
		if (this.matchAssociations([AssociationType.OWNER], other)) {
			return false;
		}
		return true;
	}
	protected hit(collision : MATTER.Collision, other : Entity) : void {
		if (other.getAttribute(AttributeType.INVINCIBLE)) {
			this._hits.add(other.id());
			return;
		}

		if (this.hasProfile()) {
			// Snap to bounds
			if (other.allTypes().has(EntityType.BOUND)) {
				this.profile().snapTo(other.profile(), /*limit=*/1);

				// Little hack to snap explosion to right spot
				this._prevPos.copyVec(this.profile().pos());
			}
		}

		if (this.hitDamage() !== 0) {
			other.takeDamage(this.hitDamage(), this);
		}
		this._hits.add(other.id());
		this.onHit();
	}

	protected explode(type : EntityType, entityOptions? : EntityOptions) : void {
		if (!this.hasProfile() || !this.profile().initialized()) {
			return;
		}

		this.addEntity(type, {
			profileInit: {
				pos: this._prevPos,
			},
			...entityOptions,
		});
	}

	abstract hitDamage() : number;
	abstract onHit() : void;
	abstract onMiss() : void;
	abstract onExpire() : void;
}