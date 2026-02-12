import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'
import earcut from 'earcut'

import { game } from 'game'
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
import { EntityFactory } from 'game/factory/entity_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { StepData } from 'game/game_object'

import { GameGlobals } from 'global/game_globals'

import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { RateLimiter } from 'util/rate_limiter'
import { Vec, Vec2 } from 'util/vector'

abstract class KnifeBase extends Projectile {

	protected static readonly _trailVertices = [
        new BABYLON.Vector3(0, 0, 0.05),
        new BABYLON.Vector3(-2, 0, 0),
        new BABYLON.Vector3(0, 0, -0.05),
	];

	protected _trail : BABYLON.Mesh;

	protected _model : Model;
	protected _profile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._trail = BABYLON.MeshBuilder.ExtrudePolygon(this.name() + "-trail", {
			shape: KnifeBase._trailVertices,
			depth: 0.1,
		}, game.scene(), earcut);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.initDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: {
				gravity: 1,
				...entityOptions.profileInit,
			}
		}));

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.KNIFE, (result : LoadResult) => {
					let mesh = result.mesh;
					mesh.rotation.y = Math.PI / 2;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._trail.rotation.x = Math.PI / 2;
		this._trail.scaling.x = 0.2;
		this._trail.material = MaterialFactory.material(MaterialType.EASTERN_RED_SOLID_TRAIL);
		this._trail.parent = this._model.root();
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		const vel = this._profile.vel();
		if (!vel.isZero()) {
			this._profile.setAngle(vel.angleRad());
		}

		this._trail.scaling.x += millis / 100;
		if (this._trail.scaling.x > 1) {
			this._trail.scaling.x = 1;
		}
	}


	protected override onHit(other : Entity) : void {
		super.onHit(other);

		this.emitParticles(/*dir=*/-1);
		this.delete();
	}

	override onMiss() : void {
		this.emitParticles(/*dir=*/1);
	}

	private emitParticles(dir : number) : void {
		if (this.initialized()) {
			for (let i = 0; i < 5; ++i) {
				this.addEntity(EntityType.CUBE_PARTICLE, {
					offline: true,
					ttl: 350,
					profileInit: {
						pos: this._profile.pos().clone().add({
							x: Fns.randomNoise(0.1),
							y: 0,
						}),
						vel: this._profile.vel().clone().scale(dir * Fns.randomRange(0.1, 0.2)),
						scaling: { x: 0.15, y: 0.15 },
					},
					modelInit: {
						transforms: {
							translate: { z: Fns.randomNoise(0.2) },
						},
						materialType: i % 2 === 0 ? MaterialType.METAL : MaterialType.EASTERN_RED_SOLID_TRAIL,
					}
				});
			}
		}
	}
}

export class Knife extends KnifeBase {
	constructor(entityOptions : EntityOptions) {
		super(EntityType.KNIFE, entityOptions);
	}
}

export class PoisoningKnife extends KnifeBase {

	private _poisonLimiter : RateLimiter;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.POISONING_KNIFE, entityOptions);

		this._poisonLimiter = new RateLimiter(60);

		this.setAttribute(AttributeType.POISONING, true);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this._poisonLimiter.check(stepData.millis)) {
			this.addEntity(EntityType.CUBE_PARTICLE, {
				offline: true,
				ttl: 800,
				profileInit: {
					pos: this._profile.pos(),
					vel: { x: 0, y: 0 },
					acc: { x: 0, y: GameGlobals.gravity / 2 },
					scaling: { x: 0.2, y: 0.2 },
				},
				modelInit: {
					materialType: MaterialType.PARTICLE_GREEN,
				}
			});
		}
	}
}