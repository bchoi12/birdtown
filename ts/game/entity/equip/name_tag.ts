import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EquipEntity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, Equip } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'
import { PlayerRole } from 'game/system/api'

import { UiGlobals } from 'global/ui_globals'

import { HudType } from 'ui/api'

import { ChangeTracker } from 'util/change_tracker'
import { Vec2 } from 'util/vector'

export class NameTag extends Equip<Entity & EquipEntity> {

	private static readonly _defaultTextColor = "#ffffff";
	private static readonly _defaultTextBackgroundColor = "#303030";
	private static readonly _defaultPointerColor = "#ff0000";

	private static readonly _height = 0.4;
	private static readonly _textureHeight = 64;
	private static readonly _pointerHeight = 0.1;

	private static readonly _pointerId = 1;
	private static readonly _barId = 2;
	private static readonly _font = "64px " + UiGlobals.font;

	private _displayName : string;
	private _enabled : boolean;
	private _visible : boolean;
	private _width : number;

	private _textColor : string;
	private _textBackgroundColor : string;
	private _colorMaterial : BABYLON.StandardMaterial;
	private _updatePointerColor : boolean;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.NAME_TAG, entityOptions);

		this._displayName = "";
		this._enabled = true;
		this._visible = true;
		this._width = 0;

		this._textColor = NameTag._defaultTextColor;
		this._textBackgroundColor = NameTag._defaultTextBackgroundColor;
		this._colorMaterial = new BABYLON.StandardMaterial(this.name() + "-color-mat");
		this._updatePointerColor = true;

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
				const text = " " + this.displayName() + " " ;

				let temp = new BABYLON.DynamicTexture(this.name() + "-temp", NameTag._textureHeight);
				let context = temp.getContext();
				context.font = NameTag._font;
				const textureWidth = context.measureText(text).width;

				const ratio = NameTag._height / NameTag._textureHeight;
				this._width = ratio * textureWidth;

				temp.dispose();

				let texture = new BABYLON.DynamicTexture(this.name() + "-texture", {
					width: textureWidth,
					height: NameTag._textureHeight,
				});
				texture.drawText(text, /*x=*/null, /*y=*/null, NameTag._font, this._textColor, this._textBackgroundColor, /*invertY=*/true);

				let material = new BABYLON.StandardMaterial(this.name() + "-material");
				material.diffuseTexture = texture;
				material.alpha = 0.9;
				material.specularColor = BABYLON.Color3.Black();

				let mesh = BABYLON.MeshBuilder.CreatePlane(this.name(), {
					width: this._width,
					height: NameTag._height,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE,
					frontUVs: new BABYLON.Vector4(-0.05, -0.05, 1.05, 1.05),
					backUVs: new BABYLON.Vector4(-0.05, -0.05, 1.05, 1.05),
				}, game.scene());
				mesh.material = material;
				mesh.scaling.z = -1;

				this._colorMaterial.disableLighting = true;
				if (this._updatePointerColor) {
					this._colorMaterial.emissiveColor = BABYLON.Color3.FromHexString(this.defaultPointerColor());
				}

				let pointer = BABYLON.MeshBuilder.CreatePolyhedron(this.name() + "-pointer", {
					type: 0, // tetrahedron
					sizeX: NameTag._pointerHeight,
					sizeY: 1.5 * NameTag._pointerHeight,
					sizeZ: 1.5 * NameTag._pointerHeight,
				}, game.scene());
				pointer.material = this._colorMaterial;

				let bar = BABYLON.MeshBuilder.CreateBox(this.name() + "-bar", {
					width: this._width,
					height: NameTag._height * 0.16,
					depth: NameTag._height * 0.1,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE,
				});
				bar.scaling.x = 0;
				bar.material = this._colorMaterial;

				model.registerSubMesh(NameTag._pointerId, pointer);
				model.registerSubMesh(NameTag._barId, bar);
				model.setMesh(mesh);
			},
			init: {
				...entityOptions.modelInit,
				disableShadows: true,
			},
		}));
	}

	override initialize() : void {
		super.initialize();

		this.updatePosition();
	}

	updatePosition() : void {
		this._model.onLoad((model : Model) => {
			model.mesh().position.y = this.owner().profile().scaledDim().y + 0.1;
			
			let bar = model.subMesh(NameTag._barId);
			bar.position.y = model.mesh().position.y - NameTag._height / 2;

			let pointer = model.subMesh(NameTag._pointerId);
			pointer.position.y = this.owner().profile().scaledDim().y - NameTag._height / 2 - NameTag._pointerHeight / 2;
			pointer.rotation.z = - Math.PI / 2;
		});
	}

	setBarWidth(percent : number) : void {
		this._model.onLoad((model : Model) => {		
			let bar = model.subMesh(NameTag._barId);
			bar.scaling.x = percent;
			bar.position.x = (percent - 1) / 2  * this._width;
		});
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
	forcePointerColor(color : string) : void {
		this._colorMaterial.emissiveColor = BABYLON.Color3.FromHexString(color);

		this._updatePointerColor = false;
	}
	private defaultPointerColor() : string {
		if (game.tablets().hasTablet(game.clientId()) && game.tablet(game.clientId()).hasColor()) {
			return game.tablet(game.clientId()).color();
		}

		return NameTag._defaultPointerColor;
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
		this._model.setVisible(this._visible && this._enabled);

		if (this._updatePointerColor && this._visible) {
			const color = game.lakitu().targetEntity().clientColorOr(this.defaultPointerColor());
			this._colorMaterial.emissiveColor = BABYLON.Color3.FromHexString(color);
		}
	}
	private setEnabled(enabled : boolean) : void {
		if (this._enabled === enabled) {
			return;
		}

		this._enabled = enabled;
		this._model.setVisible(this._visible && this._enabled);
	}

	override attachType() : AttachType { return AttachType.ROOT; }

	override preRender() : void {
		super.preRender();

		let enabled = true;
		if (this.owner().hasProfile() && !this.owner().profile().visible()
			|| this.owner().isLakituTarget()
			|| this.owner().state() === GameObjectState.DEACTIVATED) {
			enabled = false;
		} else if (this.owner().type() === EntityType.PLAYER) {
			const player = <Player>this.owner();
			if (player.healthPercent() === 0) {
				enabled = false;
			}
		}
		this.setEnabled(enabled);
	}
}
