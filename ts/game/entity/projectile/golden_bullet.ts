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

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { Vec, Vec2 } from 'util/vector'

export class GoldenBullet extends Projectile {

	private static readonly _trailVertices = [
        new BABYLON.Vector3(0, 0, 0.08),
        new BABYLON.Vector3(-2, 0, 0),
        new BABYLON.Vector3(0, 0, -0.08),
	];

	private _trail : BABYLON.Mesh;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.GOLDEN_BULLET, entityOptions);

		this._trail = BABYLON.MeshBuilder.ExtrudePolygon(this.name() + "-trail", {
			shape: GoldenBullet._trailVertices,
			depth: 0.1,
		}, game.scene(), earcut);
		this._trail.material = MaterialFactory.material(MaterialType.WESTERN_YELLOW_TRAIL);
		this._trail.rotation.x = Math.PI / 2;
		this._trail.isVisible = false;

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: {
				allowOutsideBounds: true,
				...entityOptions.profileInit,
			}
		}));
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.WESTERN_YELLOW).toString(),
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();
				let mesh = BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameterX: dim.x,
					diameterY: dim.y,
					diameterZ: 0.1,
				}, game.scene());


				game.world().glow(mesh, {
					intensity: 0.5,
				});

				mesh.addChild(this._trail);
				this._trail.isVisible = true;
				this._trail.scaling.x = 0.4;

				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				materialType: MaterialType.WESTERN_YELLOW,
				...entityOptions.modelInit,
			},
		}));
	}

	protected trailScaling(stepData : StepData) : number {
		return Math.min(1.2, this._trail.scaling.x + 6 * stepData.millis / 1000);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		this._trail.scaling.x = this.trailScaling(stepData);
	}

	override onHit(other : Entity) : void {
		super.onHit(other);

		this.explode(EntityType.GOLDEN_EXPLOSION, {});
		this.delete();
	}

	override onMiss() : void {
		this.explode(EntityType.GOLDEN_EXPLOSION, {});
	}
}