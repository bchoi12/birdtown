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

export class Orb extends Projectile {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ORB, entityOptions);

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
			color: ColorFactory.color(ColorType.WHITE).toString(),
		})
		this._profile.setOutOfBoundsFn((profile : Profile) => {
			this.delete();
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();
				let mesh = BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: 0.9 * dim.x,
				}, game.scene());

				let ring = BABYLON.MeshBuilder.CreateCylinder(this.name() + "-ring", {
					height: dim.x / 2,
					diameter: 1.1 * dim.x,
				}, game.scene());
				ring.rotation.x = Math.PI / 2;
				ring.material = MaterialFactory.material(MaterialType.SHOOTER_ORANGE);
				mesh.addChild(ring);

				game.world().glow(ring, {
					intensity: 0.5,
				});

				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				materialType: MaterialType.SHOOTER_WHITE,
				...entityOptions.modelInit,
			},
		}));
	}

	override hitDamage() : number { return 12; }

	override onHit(other : Entity) : void {
		super.onHit(other);

		this.explode(EntityType.ORB_EXPLOSION, {});
		this.delete();
	}

	override onMiss() : void {
		this.explode(EntityType.ORB_EXPLOSION, {});
	}
	override onExpire() : void { this.onMiss(); }
}