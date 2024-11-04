import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'
import earcut from 'earcut'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Projectile } from 'game/entity/projectile'
import { CollisionCategory, ColorType, MaterialType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'

import { Fns } from 'util/fns'
import { Vec, Vec2 } from 'util/vector'

export class Pellet extends Projectile {

	private static readonly _trailVertices = [
        new BABYLON.Vector3(0, 0, 0.1),
        new BABYLON.Vector3(-1, 0, 0),
        new BABYLON.Vector3(0, 0, -0.1),
	];

	private _trail : BABYLON.Mesh;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PELLET, entityOptions);


		this._trail = BABYLON.MeshBuilder.ExtrudePolygon(this.name() + "-trail", {
			shape: Pellet._trailVertices,
			depth: 0.2,
		}, game.scene(), earcut);
		this._trail.material = MaterialFactory.material(MaterialType.WESTERN_YELLOW_TRAIL);
		this._trail.rotation.x = Math.PI / 2;
		this._trail.isVisible = false;

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.WESTERN_YELLOW).toString(),
		})
		this._profile.setOutOfBoundsFn((profile : Profile) => {
			this.delete();
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				const dim = this._profile.unscaledDim();
				let mesh = BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: dim.x,
				}, game.scene());

				mesh.addChild(this._trail);
				this._trail.isVisible = true;
				this._trail.scaling.x = 0.4;

				game.world().glow(mesh, {
					intensity: 0.5,
				});

				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				materialType: MaterialType.WESTERN_YELLOW,
				...entityOptions.modelInit,
			},
		}));
	}

	override hitDamage() : number { return 9; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		this._trail.scaling.x = Math.min(1.2, this._trail.scaling.x + 4 * stepData.millis / 1000);
	}

	override onHit(other : Entity) : void {
		super.onHit(other);

		this.addEntity(EntityType.CUBE_PARTICLE, {
			offline: true,
			ttl: 600,
			profileInit: {
				pos: this._profile.pos().clone().add({ x: Fns.randomRange(-0.1, 0.1), y: Fns.randomRange(-0.1, 0.1), }),
				vel: Vec2.fromVec(this._profile.vel()).rotateDeg(150 + 60 * Math.random()).normalize().scaleVec({
					x: Fns.randomRange(0.05, 0.1),
					y: Fns.randomRange(0.05, 0.1),
				}),
				scaling: { x: 0.1, y: 0.1 },
			},
			modelInit: {
				transforms: {
					translate: { z: this.model().translation().z + Fns.randomRange(-0.1, 0.1) },
				},
				materialType: MaterialType.WESTERN_YELLOW,
			}
		});
		this.delete();
	}

	override onMiss() : void {}
}