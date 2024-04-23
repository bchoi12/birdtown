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
import { MaterialType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { Vec, Vec2 } from 'util/vector'

export class Bolt extends Projectile {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOLT, entityOptions);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
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
				const dim = this._profile.unscaledDim();
				const depth = (dim.x + dim.y) / 2;

				let mesh = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: depth,
				}, game.scene());

				model.setMesh(mesh);
			},
			init: entityOptions.modelInit,
		}));
	}

	override damage() : number { return this.getAttribute(AttributeType.CHARGED) ? 70 : 12; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		const vel = this._profile.vel();
		if (!vel.isZero()) {
			this._profile.setAngle(vel.angleRad());
		}
	}

	override onHit() : void {
		if (this.getAttribute(AttributeType.CHARGED)) {
			this.explode({
				modelInit: {
					materialType: MaterialType.BOLT_EXPLOSION,
				},
			});
		} else {
			for (let i = 0; i < 3; ++i) {
				this.addEntity(EntityType.PARTICLE_SPARK, {
					offline: true,
					ttl: 300,
					profileInit: {
						pos: this._profile.pos(),
						vel: Vec2.fromVec(this._profile.vel()).negate().normalize().scaleVec({
							x: Fns.randomRange(0.05, 0.2),
							y: Fns.randomRange(0.05, 0.2),
						}),
						scaling: { x: Fns.randomRange(0.2, 0.3), y: 0.12 },
					},
					modelInit: {
						transforms: {
							translate: { z: this._model.mesh().position.z + Fns.randomRange(-0.1, 0.1), },
						},
						materialType: MaterialType.SPARK_BLUE,
					}
				});
			}
		}
	}

	override onFizzle() : void {
		if (this.getAttribute(AttributeType.CHARGED)) {
			this.explode({
				modelInit: {
					materialType: MaterialType.BOLT_ORANGE,
				},
			});
		}
	}
}