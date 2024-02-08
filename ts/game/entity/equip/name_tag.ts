import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, Equip } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { UiGlobals } from 'global/ui_globals'

import { Vec2 } from 'util/vector'

export class NameTag extends Equip<Player> {

	private static readonly _font = "64px " + UiGlobals.font;

	private _displayName : string;

	protected _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.NAME_TAG, entityOptions);

		this._displayName = "";

		this.addProp<string>({
			has: () => { return this.hasDisplayName(); },
			export: () => { return this._displayName; },
			import: (obj : string) => { this.setDisplayName(obj); },
		})

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._displayName.length > 0;
			},
			meshFn: (model : Model) => {
				const planeHeight = 0.4;
				const textureHeight = 64;
				const text = this.displayName();

				let temp = new BABYLON.DynamicTexture(this.name() + "-temp", 64, game.scene());

				let context = temp.getContext();
				context.font = NameTag._font;
				const textureWidth = context.measureText(text).width;

				const ratio = planeHeight / textureHeight;
				const planeWidth = ratio * textureWidth;

				let texture = new BABYLON.DynamicTexture(this.name() + "-texture", {
					width: textureWidth,
					height: textureHeight,
				}, game.scene());
				texture.drawText(text, /*x=*/null, /*y=*/null, NameTag._font, "#fbfbfb", "#0b0b0b", /*invertY=*/false);

				let material = new BABYLON.StandardMaterial(this.name() + "-material");
				material.diffuseTexture = texture;
				material.alpha = 0.6;

				let faceUV = new Array(6);
				for (let i = 0; i < 6; i++) {
				    faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0);
				}
				faceUV[0] = new BABYLON.Vector4(-0.05, -0.05, 1.05, 1.05);

				let mesh = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: planeWidth,
					height: planeHeight,
					depth: 0.3,
					faceUV: faceUV,
				}, game.scene());
				mesh.material = material;

				model.setMesh(mesh);
			},
			init: entityOptions.modelInit,
		}));
	}

	override initialize() : void {
		super.initialize();

		this._model.onLoad((model : Model) => {
			model.mesh().position.y = this.owner().profile().scaledDim().y;
		})
	}

	hasDisplayName() : boolean { return this._displayName.length > 0; }
	displayName() : string { return this.hasDisplayName() ? this._displayName : "unknown" }
	setDisplayName(displayName : string) : void {
		if (displayName.length === 0) {
			console.error("Error: skipping empty name");
			return;
		}
		this._displayName = displayName;
	}

	override attachType() : AttachType { return AttachType.ROOT; }
	override equipName() : string { return "Name tag"; }
}
