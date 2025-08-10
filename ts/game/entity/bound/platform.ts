
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BoundBase } from 'game/entity/bound'
import { ColorCategory, DepthType } from 'game/factory/api'

export class Platform extends BoundBase {

	private _outlineEdges : number;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLATFORM, entityOptions);

		this._outlineEdges = 0;

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

		this.addProp<number>({
			has: () => { return this._outlineEdges > 0; },
			import: (obj : number) => { this.outlineEdges(obj); },
			export: () => { return this._outlineEdges; },
		});
	}

	outlineEdges(width : number) : void {
		this._outlineEdges = width;

		this._model.onLoad((model : Model) => {
			model.mesh().enableEdgesRendering();
			model.mesh().edgesWidth = width;
			model.mesh().edgesColor = new BABYLON.Color4(0, 0, 0, 1);
		});
	}

	override initialize() : void {
		super.initialize();

		this._model.setFrozen(true);
	}
}