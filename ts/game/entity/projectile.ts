import * as MATTER from 'matter-js'

import { AssociationType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'

import { Optional } from 'util/optional'
import { Vec2 } from 'util/vector'

export abstract class Projectile extends EntityBase {

	protected _hits : Set<number>;
	protected _maxPenetration : Optional<Vec2>;

	protected _association : Association;
	protected _attributes : Attributes;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.PROJECTILE);

		this._hits = new Set();
		this._maxPenetration = new Optional();

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
	}

	override ready() : boolean {
		return super.ready() && this._association.hasAssociation(AssociationType.OWNER);
	}

	override delete() : void {
		super.delete();

		if (this._hits.size === 0) {
			this.onFizzle();
		}
	}

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		this._maxPenetration.clear();
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		if (this.hits().size === 0) {
			return;
		}

		if (this._maxPenetration.has() && this.hasProfile()) {
			this.profile().pos().sub(this._maxPenetration.get());
		}
		this.onHit();
		this.delete();
	}

	explode(entityOptions? : EntityOptions) : void {
		if (!this.hasProfile() || !this.profile().initialized()) {
			return;
		}

		const profile = this.profile();
		this.addEntity(EntityType.EXPLOSION, {
			ttl: 200,
			profileInit: {
				pos: profile.pos(),
				dim: {x: 3, y: 3},
			},
			...entityOptions,
		});
	}
	hit(collision : MATTER.Collision, other : Entity) : void {
		if (this._hits.has(other.id())) {
			return;
		}

		const penetration = Vec2.fromVec(collision.penetration);
		if (!this._maxPenetration.has() ||
			(this.profile().vel().dot(penetration) < 0 && penetration.lengthSq() > this._maxPenetration.get().lengthSq())) {
			this._maxPenetration.set(penetration);
		}
		other.takeDamage(this.damage(), this);
		this._hits.add(other.id());
	}
	hits() : Set<number> { return this._hits; }

	abstract damage() : number;
	abstract onHit() : void;
	abstract onFizzle() : void;
}