
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { Enemy } from 'game/entity/enemy'
import { CollisionCategory } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { StepData } from 'game/game_object'

export class BlockEnemy extends Enemy {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BLOCK_ENEMY, entityOptions);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.SOLID),
				});
			},
			init: entityOptions.profileInit,
		}));

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready() },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();
				let mesh = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: dim.z,
				}, game.scene());
				model.setMesh(mesh);
			},
			init: entityOptions.modelInit,
		}));
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
	}
}