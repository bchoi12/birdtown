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

	protected _hits : Set<number>;

	protected _association : Association;
	protected _attributes : Attributes;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.PROJECTILE);

		this._hits = new Set();

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

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this.canHit(collision, other)) {
			this.hit(collision, other);
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		if (this.hits().size === 0) {
			return;
		}

		this.onHit();
	}

	hits() : Set<number> { return this._hits; }

	protected canHit(collision : MATTER.Collision, other : Entity) : boolean {
		if (other.getAttribute(AttributeType.INVINCIBLE)) {
			return false;
		}
		if (this.matchAssociations([AssociationType.OWNER], other)) {
			return false;
		}
		return other.getAttribute(AttributeType.SOLID);
	}
	protected hit(collision : MATTER.Collision, other : Entity) : void {
		if (this._hits.has(other.id())) {
			return;
		}

		// Snap to bound
		if (this.hasProfile() && other.allTypes().has(EntityType.BOUND)) {
			this.profile().snapTo(other.profile(), /*limit=*/1);
		}

		if (this.hitDamage() !== 0) {
			other.takeDamage(this.hitDamage(), this);
		}
		this._hits.add(other.id());
	}

	protected explode(entityOptions? : EntityOptions) : void {
		if (!this.hasProfile() || !this.profile().initialized()) {
			return;
		}

		this.addEntity(EntityType.EXPLOSION, {
			ttl: 200,
			profileInit: {
				pos: this.profile().pos(),
				dim: {x: 3, y: 3},
			},
			...entityOptions,
		});
	}

	abstract hitDamage() : number;
	abstract onHit() : void;
	abstract onMiss() : void;
	abstract onExpire() : void;
}