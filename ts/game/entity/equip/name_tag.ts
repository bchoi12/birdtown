import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EquipEntity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, Equip } from 'game/entity/equip'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'
import { PlayerRole } from 'game/system/api'

import { UiGlobals } from 'global/ui_globals'

import { ChangeTracker } from 'util/change_tracker'
import { Vec2 } from 'util/vector'

export class NameTag extends Equip<Entity & EquipEntity> {

	private static readonly _height = 0.4;
	private static readonly _pointerHeight = 0.1;

	private static readonly _pointerId = 1;
	private static readonly _font = "64px " + UiGlobals.font;

	private _displayName : string;
	private _occluded : boolean;
	private _visible : boolean;

	private _textColor : string;
	private _textBackgroundColor : string;
	private _pointerColor : string;

	protected _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.NAME_TAG, entityOptions);

		this._displayName = "";
		this._occluded = false;
		this._visible = true;

		this._textColor = "#ffffff";
		this._textBackgroundColor = "#333333";
		this._pointerColor = "#ff0000";

		this.addProp<string>({
			has: () => { return this.hasDisplayName(); },
			export: () => { return this._displayName; },
			import: (obj : string) => { this.setDisplayName(obj); },
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._displayName.length > 0;
			},
			meshFn: (model : Model) => {
				const planeHeight = NameTag._height;
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
				texture.drawText(text, /*x=*/null, /*y=*/null, NameTag._font, this._textColor, this._textBackgroundColor, /*invertY=*/false);

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
					depth: 0.1,
					faceUV: faceUV,
				}, game.scene());
				mesh.material = material;

				let pointer = BABYLON.MeshBuilder.CreatePolyhedron(this.name() + "-pointer", {
					type: 0, // tetrahedron
					sizeX: NameTag._pointerHeight,
					sizeY: 1.5 * NameTag._pointerHeight,
					sizeZ: 1.5 * NameTag._pointerHeight,
				}, game.scene());
				let pointerMaterial = new BABYLON.StandardMaterial(this.name() + "-pointer-mat");
				pointerMaterial.disableLighting = true;
				pointerMaterial.emissiveColor = BABYLON.Color3.FromHexString(this._pointerColor);
				pointer.material = pointerMaterial;

				model.registerSubMesh(NameTag._pointerId, pointer);
				model.setMesh(mesh);
			},
			init: entityOptions.modelInit,
		}));
	}

	override initialize() : void {
		super.initialize();

		this._model.onLoad((model : Model) => {
			model.mesh().position.y = this.owner().profile().scaledDim().y + 0.1;
			
			let pointer = model.subMesh(NameTag._pointerId);
			pointer.position.y = this.owner().profile().scaledDim().y - NameTag._height / 2 - NameTag._pointerHeight / 2;
			pointer.rotation.z = - Math.PI / 2;
		})
	}

	setTextColor(color : string) : void {
		if (this.initialized()) {
			console.error("Error: cannot set text color of initialized %s", this.name());
			return;
		}
		this._textColor = color;
	}
	setTextBackgroundColor(color : string) : void {
		if (this.initialized()) {
			console.error("Error: cannot set text background color of initialized %s", this.name());
			return;
		}
		this._textBackgroundColor = color;
	}
	setPointerColor(color : string) : void {
		if (this.initialized()) {
			console.error("Error: cannot set text background color of initialized %s", this.name());
			return;
		}
		this._pointerColor = color;
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

	setVisible(visible : boolean) : void {
		if (this._visible === visible) {
			return;
		}

		this._visible = visible;
		this._model.setVisible(this._visible && !this._occluded);
	}
	private setOccluded(occluded : boolean) : void {
		if (this._occluded === occluded) {
			return;
		}

		this._occluded = occluded;
		this._model.setVisible(this._visible && !this._occluded);
	}

	override attachType() : AttachType { return AttachType.ROOT; }

	override preRender() : void {
		super.preRender();

		let occluded = false;
		if (this.owner().getAttribute(AttributeType.OCCLUDED)) {
			occluded = true;
		} else if (this.owner().type() === EntityType.PLAYER) {
			if (game.playerStates().hasPlayerState(this.owner().clientId())
				&& game.playerState(this.owner().clientId()).role() !== PlayerRole.GAMING) {
				occluded = true;
			}
		}
		this.setOccluded(occluded);
	}
}
