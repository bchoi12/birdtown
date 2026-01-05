import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { Projectile } from 'game/entity/projectile'
import { CollisionCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'
import { Vec, Vec2 } from 'util/vector'

export abstract class RocketBase extends Projectile {

	protected _explosionType : EntityType;
	protected _smoker : RateLimiter;

	protected _model : Model;
	protected _profile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.ROCKET);

		this._explosionType = EntityType.ROCKET_EXPLOSION;
		this._smoker = new RateLimiter(20);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.ROCKET, (result : LoadResult) => {
					let mesh = result.mesh;
					mesh.rotation.y = Math.PI / 2;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.initDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: entityOptions.profileInit,
		}));

		this.setAttribute(AttributeType.BURNING, true);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this._smoker.check(millis)) {
			this.addEntity(EntityType.SMOKE_PARTICLE, {
				offline: true,
				ttl: 1000,
				profileInit: {
					pos: this._profile.pos().clone().add({ x: Fns.randomNoise(0.05), y: Fns.randomNoise(0.05), }),
					scaling: { x: 0.3 * this._profile.scaling().x, y : 0.3 * this._profile.scaling().x },
				},
			});
		}

		if (this._model.hasMesh()) {
			this._model.mesh().rotation.z += 6 * Math.PI * millis / 1000; 
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		this._model.mesh().rotation.x = -this._profile.vel().angleRad();
	}

	protected override onHit(other : Entity) : void {
		super.onHit(other);

		this.explode(this._explosionType, {});
		this.delete();
	}

	override onMiss() : void {
		this.explode(this._explosionType, {});
	}
}

export class Rocket extends RocketBase {
	constructor(entityOptions : EntityOptions) {
		super(EntityType.ROCKET, entityOptions);
	}
}