
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BoundBase } from 'game/entity/bound'
import { ColorCategory, DepthType } from 'game/factory/api'

export class Platform extends BoundBase {

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLATFORM, entityOptions);

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
}