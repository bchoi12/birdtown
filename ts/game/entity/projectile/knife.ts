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

import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

export class Knife extends Projectile {

	private static readonly _trailVertices = [
        new BABYLON.Vector3(0, 0, 0.05),
        new BABYLON.Vector3(-2, 0, 0),
        new BABYLON.Vector3(0, 0, -0.05),
	];

	private _trail : BABYLON.Mesh;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.KNIFE, entityOptions);

		this._trail = BABYLON.MeshBuilder.ExtrudePolygon(this.name() + "-trail", {
			shape: Knife._trailVertices,
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
				gravity: true,
				...entityOptions.profileInit,
			}
		}));
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.EASTERN_RED).toString(),
		})

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