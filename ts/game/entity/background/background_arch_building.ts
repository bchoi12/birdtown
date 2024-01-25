import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

export class BackgroundArchBuilding extends EntityBase implements Entity {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BACKGROUND_ARCH_BUILDING, entityOptions);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				let building = BABYLON.MeshBuilder.CreatePlane("background_arch_building", {
					width: this._profile.unscaledDim().x,
					height: this._profile.unscaledDim().y,
				}, game.scene());

				model.offlineTransforms().setTranslation({z: -18 });
				model.offlineTransforms().setRotation({x: Math.PI });
				model.setMesh(building);
			},
			init: {
				disableShadows: true,
				...entityOptions.modelInit,
			},
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isStatic: true,
					isSensor: true,
					render: {
						visible: false,
					},
				});
			},
			init: entityOptions.profileInit,
		}));
	}
}