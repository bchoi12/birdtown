import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'
import { StepData } from 'game/game_object'

export class Cloud extends EntityBase implements Entity {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CLOUD, entityOptions);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				let cloud = BABYLON.MeshBuilder.CreateBox("cloud", {
					width: this._profile.unscaledDim().x,
					height: this._profile.unscaledDim().y,
					depth: 2,
				}, game.scene());

				// TODO: instanced mesh
				cloud.material = game.materialCache().material(this.type());
				model.setMesh(cloud);
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
					render: {
						visible: false,
					},
				});
			},
			init: {...entityOptions.profileInit, degraded: true },
		}));

	}
}