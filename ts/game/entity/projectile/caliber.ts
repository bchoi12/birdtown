import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

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

export class Caliber extends Projectile {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CALIBER, entityOptions);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.HIT_BOX),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.SHOOTER_YELLOW).toString(),
		})
		this._profile.setOutOfBoundsFn((profile : Profile) => {
			this.delete();
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
					intensity: 0.6,
				});
				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				materialType: MaterialType.SHOOTER_YELLOW,
				...entityOptions.modelInit,
			},
		}));
	}

	override onHit(other : Entity) : void {
		super.onHit(other);

		if (this.initialized()) {			
			for (let i = 0; i < 3; ++i) {
				this.addEntity(EntityType.SPARK_PARTICLE, {
					offline: true,
					ttl: 400,
					profileInit: {
						pos: this._profile.pos(),
						vel: Vec2.fromVec(this._profile.vel()).rotateDeg(150 + 60 * Math.random()).normalize().scaleVec({
							x: Fns.randomRange(0.1, 0.2),
							y: Fns.randomRange(0.1, 0.2),
						}),
						scaling: { x: Fns.randomRange(0.3, 0.5), y: 0.2 },
					},
					modelInit: {
						transforms: {
							translate: { z: Fns.randomRange(-0.1, 0.1), },
						},
						materialType: MaterialType.PARTICLE_YELLOW,
					}
				});
			}
		}
		this.delete();
	}

	override onMiss() : void {}
}