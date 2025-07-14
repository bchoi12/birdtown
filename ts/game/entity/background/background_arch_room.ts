import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { BackgroundEntity } from 'game/entity/background_entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

import { Fns } from 'util/fns'

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
					width: this._profile.initDim().x,
					height: this._profile.initDim().y,
					depth: 8,
					faceUV: faceUV,
				}, game.scene());
				model.setMesh(mesh);
			},
			init: {
				disableShadows: true,
				transforms: {
					translate: { z: -24 },
				},
				...entityOptions.modelInit,
			},
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					isStatic: true,
					isSensor: true,
				});
			},
			init: {
				allowOutsideBounds: true,
				...entityOptions.profileInit,
			},
		}));
		this._profile.setVisible(false);
	}

	override initialize() : void {
		super.initialize();

		this._profile.setPos({ x: this._profile.pos().x + 3 });
	}
}