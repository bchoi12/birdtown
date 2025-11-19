import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { CollisionCategory, MaterialType, SoundType, StatType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MaterialFactory } from 'game/factory/material_factory'

import { Fns } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec, Vec2 } from 'util/vector'

export abstract class Explosion extends EntityBase implements Entity {

	protected static readonly _ttl = 180;
	protected static readonly _nominalDiameter = 3;
	protected static readonly _fadePercent = 0.6;

	protected _hits : Set<number>;
	protected _lifeTimer : Timer;

	protected _association : Association;
	protected _profile : Profile;
	protected _model : Model;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.allTypes().add(EntityType.EXPLOSION);

		this._lifeTimer = this.newTimer({
			canInterrupt: false,
		});
		this._hits = new Set();

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.initDim(), {
					isStatic: true,
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.EXPLOSION),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setMinimapOptions({
			color: this.color(),
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: (model: Model) => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				model.setMesh(this.meshFn());
			},
			init: {
				disableShadows: true, 
				materialType: this.materialType(),
				...entityOptions.modelInit,
			},
		}));

		if (this.soundType() !== SoundType.UNKNOWN) {
			this.soundPlayer().registerSound(this.soundType());
		}
	}

	override ready() : boolean {
		return super.ready() && this._association.hasRefreshedOwner();
	}

	meshFn() : BABYLON.Mesh {
		return BABYLON.MeshBuilder.CreateSphere(this.name(), {
			diameter: this._profile.initDim().x,
		}, game.scene())
	}

	abstract force() : number;
	abstract materialType() : MaterialType;
	soundType() : SoundType { return SoundType.EXPLOSION; }
	ttl() : number { return Explosion._ttl; }
	color() : string { return MaterialFactory.material<BABYLON.StandardMaterial>(this.materialType()).emissiveColor.toHexString(); }
	fading() : boolean { return this._lifeTimer.percentElapsed() > Explosion._fadePercent; }

	override initialize() : void {
		super.initialize();

		if (this.soundType() !== SoundType.UNKNOWN) {
			this.soundPlayer().playFromSelf(this.soundType());
		}
		this._lifeTimer.start(this.ttl() * 2, () => {
			this.delete();
		});

		if (this.isSource()) {
			this.profile().multScaling(this.owner().getStat(StatType.SCALING) + this.owner().getStat(StatType.PROJECTILE_SCALING_BOOST));
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const percent = this._lifeTimer.percentElapsed();

		if (!this.fading()) {
			const weight = Fns.clamp(0, 4 * percent / Explosion._fadePercent, 1);
			this._model.scaling().setAll(weight);
		} else {
			const weight = Fns.clamp(0, 1 - (percent - Explosion._fadePercent) / (1 - Explosion._fadePercent), 1);
			this._model.scaling().setAll(weight);
		}
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this.fading()) {
			return;
		}

		if (this._hits.has(other.id())) {
			return;
		}

		if (collision.bodyB.isStatic) {
			return;
		}

		// Affect projectiles
		let magnitude = this.force();
		if (other.allTypes().has(EntityType.PROJECTILE)
			&& Math.abs(magnitude) >= 0.5
			&& !other.profile().vel().isZero()
			&& !this.matchAssociations([AssociationType.OWNER], other)) {
			if (this.isSource()) {
				let dist = other.profile().pos().clone().sub(this._profile.pos());
				if (magnitude < 0) {
					dist.negate();
				}

				if (!dist.isZero()) {
					MATTER.Body.setVelocity(other.profile().body(), other.profile().vel().setAngleRad(dist.angleRad()));
				}
			}
			this._hits.add(other.id());
			return;
		}

		if (!other.getAttribute(AttributeType.SOLID)) {
			return;
		}

		if (!other.getAttribute(AttributeType.INVINCIBLE) && !other.getAttribute(AttributeType.COOL)) {
			if (this.owner().hasStat(StatType.EXPLOSION_BOOST)) {
				magnitude *= (1 + this.owner().getStat(StatType.EXPLOSION_BOOST));
			}

			// Use body to handle multi-body profiles.
			const force = Vec2.fromVec(collision.bodyB.position).sub(collision.bodyA.position).setLength(magnitude);
			other.addForce(force);

			if (magnitude > 0
				&& !this.matchAssociations([AssociationType.OWNER], other)
				&& this.owner().hasStat(StatType.EXPLOSION_DAMAGE)) {

				const damage = magnitude * this.owner().getStat(StatType.EXPLOSION_DAMAGE) * (1 + this.owner().getStat(StatType.DAMAGE_BOOST));
				if (damage > 0) {
					other.takeDamage(damage, this.owner(), this);
				}
			}
		}

		this._hits.add(other.id());
	}

}