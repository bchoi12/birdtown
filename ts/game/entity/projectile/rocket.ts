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
import { MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'
import { Vec, Vec2 } from 'util/vector'

export class Rocket extends Projectile {

	private _smoker : RateLimiter;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ROCKET, entityOptions);

		this._smoker = new RateLimiter(24);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
				});
			},
			init: entityOptions.profileInit,
		}));

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.ROCKET, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					model.offlineTransforms().setRotation({ y: Math.PI / 2 });
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override damage() : number { return 50; }

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._smoker.check(millis)) {
			this.addEntity(EntityType.PARTICLE_SMOKE, {
				offline: true,
				ttl: 500,
				profileInit: {
					pos: this._profile.pos().clone().add({ x: Fns.randomRange(-0.05, 0.05), y: Fns.randomRange(-0.05, 0.05), }),
					scaling: { x: 0.2, y : 0.2 },
				},
				modelInit: {
					transforms: {
						translate: { z: this._model.mesh().position.z },
					}
				}
			});
		}

		this._model.offlineTransforms().rotation().z += 6 * Math.PI * millis / 1000; 
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		this._model.offlineTransforms().rotation().x = -this._profile.vel().angleRad();
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this.matchAssociations([AssociationType.OWNER], other)) {
			return;
		}

		// TODO: collide with multiple objects?
		if (other.getAttribute(AttributeType.SOLID)) {
			other.takeDamage(this.damage(), this);
			this.explode();
			this.delete();
		}
	}
}