import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { BackgroundEntity } from 'game/entity/background_entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

export class BackgroundArchRoom extends BackgroundEntity implements Entity {

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BACKGROUND_ARCH_ROOM, entityOptions);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				let faceUV = new Array(6);
				for (let i = 0; i < 6; i++) {
				    faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0);
				}
				faceUV[0] = new BABYLON.Vector4(0, 0, 1, -1);

				let mesh = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: this._profile.unscaledDim().x,
					height: this._profile.unscaledDim().y,
					depth: 6,
					faceUV: faceUV,
				}, game.scene());

				mesh.position.z = -25;
				model.setMesh(mesh);
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
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setVisible(false);
	}
}