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

export abstract class BoltBase extends Projectile {

	protected _glow : number;

	protected _model : Model;
	protected _profile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.BOLT);

		this._glow = 0.5;

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
			color: ColorFactory.color(ColorType.SHOOTER_BLUE).toString(),
		})
		this._profile.setOutOfBoundsFn((profile : Profile) => {
			this.delete();
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();
				const depth = (dim.x + dim.y) / 2;

				let mesh = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: depth,
				}, game.scene());

				if (this._glow > 0) {
					game.world().glow(mesh, {
						intensity: this._glow,
					});
				}

				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				materialType: this.materialType(),
				...entityOptions.modelInit,
			},
		}));
	}

	protected materialType() : MaterialType {
		switch (this.type()) {
		case EntityType.CHARGED_BOLT:
			return MaterialType.SHOOTER_ORANGE;
		default:
			return MaterialType.SHOOTER_BLUE;
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const vel = this._profile.vel();
		if (!vel.isZero()) {
			this._profile.setAngle(vel.angleRad());
		}
	}

	override onMiss() : void {}
}

export class Bolt extends BoltBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOLT, entityOptions);
	}

	override onHit(other : Entity) : void {
		super.onHit(other);

		this.delete();

		if (!this.initialized()) {
			return;
		}

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
						translate: { z: Fns.randomNoise(0.1), },
					},
					materialType: MaterialType.PARTICLE_BLUE,
				}
			});
		}
	}
}