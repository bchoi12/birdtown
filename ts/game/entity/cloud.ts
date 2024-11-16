import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MaterialType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { StepData } from 'game/game_object'

import { Vec2 } from 'util/vector'

export class Cloud extends EntityBase implements Entity {

	private _initPos : Vec2;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CLOUD, entityOptions);

		this._initPos = Vec2.zero();

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				let cloud = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: this._profile.unscaledDim().x,
					height: this._profile.unscaledDim().y,
					depth: 2,
				}, game.scene());

				// TODO: instanced mesh
				cloud.material = MaterialFactory.material(MaterialType.CLOUD);
				model.setMesh(cloud);
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
					friction: 0,
					frictionAir: 0,
					collisionFilter: BodyFactory.neverCollideFilter(),
				});
			},
			init: {...entityOptions.profileInit, degraded: true },
		}));
		this._profile.setVisible(false);
	}

	override initialize() : void {
		super.initialize();

		this._initPos.copyVec(this._profile.pos());
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const bounds = game.level().bounds();
		const side = bounds.xSide(this._profile.pos(), /*buffer=*/-this._profile.unscaledDim().x / 2);
		if (side !== 0) {
			this._profile.vel().x = -side * Math.abs(this._profile.vel().x);
		}
	}
}