import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { CollisionCategory, MaterialType, SoundType } from 'game/factory/api'
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

	protected _profile : Profile;
	protected _model : Model;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.allTypes().add(EntityType.EXPLOSION);

		this._lifeTimer = this.newTimer({
			canInterrupt: false,
		});
		this._hits = new Set();

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.initDim(), {
					isStatic: true,
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: {
				allowOutsideBounds: true,
				...entityOptions.profileInit,
			},
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

		if (collision.bodyB.isStatic || collision.bodyB.isSensor) {
			return;
		}

		if (!other.getAttribute(AttributeType.SOLID)) {
			return;
		}

		if (this.matchAssociations([AssociationType.OWNER], other)) {
			return;
		}

		if (!other.getAttribute(AttributeType.INVINCIBLE)) {
			const magnitude = this.force();
			// Use body to handle multi-body profiles.
			const force = Vec2.fromVec(collision.bodyB.position).sub(collision.bodyA.position).setLength(magnitude);
			other.addForce(force);
		}

		this._hits.add(other.id());
	}

}