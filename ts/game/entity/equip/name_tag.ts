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
import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { Vec2 } from 'util/vector'

enum SubMesh {
	POINTER = 1,
	BAR = 2,
}

export class NameTag extends Equip<Entity & EquipEntity> {

	private static readonly _defaultTextColor = "#ffffff";
	private static readonly _defaultTextBackgroundColor = "#30303088";
	private static readonly _defaultPointerColor = "#ff0000";

	private static readonly _height = 0.4;
	private static readonly _textureHeight = 64;
	private static readonly _pointerHeight = 0.1;

	private static readonly _font = "64px " + UiGlobals.font;

	private _displayName : Optional<string>;
	private _enabled : boolean;
	private _oscillateTime : number;
	private _oscillation : number;
	private _visible : boolean;
	private _width : number;

	private _textColor : string;
	private _textBackgroundColor : string;
	private _colorMaterial : BABYLON.StandardMaterial;
	private _updatePointerColor : boolean;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.NAME_TAG, entityOptions);

		this._displayName = new Optional();
		this._enabled = true;
		this._oscillateTime = 0;
		this._oscillation = 0;
		this._visible = true;
		this._width = 0;

		this._textColor = NameTag._defaultTextColor;
		this._textBackgroundColor = NameTag._defaultTextBackgroundColor;
		this._colorMaterial = new BABYLON.StandardMaterial(this.name() + "-color-mat");
		this._updatePointerColor = true;

		this.addProp<string>({
			has: () => { return this._displayName.has(); },
			export: () => { return this._displayName.get(); },
			import: (obj : string) => { this.setDisplayName(obj); },
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: (model : Model) => {
				return this._displayName.has();
			},
			meshFn: (model : Model) => {
				const displayName = this.displayName();
				let mesh;
				if (displayName !== "") {
					const text = ` ${displayName} `;

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
					texture.hasAlpha = true;

					let material = new BABYLON.StandardMaterial(this.name() + "-material");
					material.diffuseTexture = texture;
					material.specularColor = BABYLON.Color3.Black();

					mesh = BABYLON.MeshBuilder.CreatePlane(this.name(), {
						width: this._width,
						height: NameTag._height,
						sideOrientation: BABYLON.Mesh.DOUBLESIDE,
						frontUVs: new BABYLON.Vector4(-0.05, -0.05, 1.05, 1.05),
						backUVs: new BABYLON.Vector4(-0.05, -0.05, 1.05, 1.05),
					}, game.scene());
					mesh.material = material;
					mesh.scaling.z = -1;
				} else {
					mesh = new BABYLON.TransformNode("empty");
				}

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
					height: NameTag._height * 0.2,
					depth: NameTag._height * 0.1,
					sideOrientation: BABYLON.Mesh.DOUBLESIDE,
				});
				bar.scaling.x = 0;
				bar.material = this._colorMaterial;

				model.registerSubMesh(SubMesh.POINTER, pointer);
				model.registerSubMesh(SubMesh.BAR, bar);
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

		this._model.translation().y = 0.1;
		// Prevent overlap with other nametags
		this._model.translation().z = Fns.randomNoise(0.05);

		this._model.onLoad((model : Model) => {
			model.mesh().position.y = this.owner().profile().dim().y / 2 + NameTag._height;
			
			let bar = model.subMesh(SubMesh.BAR);
			bar.position.y = model.mesh().position.y - NameTag._height / 2;

			let pointer = model.subMesh(SubMesh.POINTER);
			pointer.position.y = bar.position.y - NameTag._pointerHeight / 2;
			pointer.rotation.z = - Math.PI / 2;
		});
	}

	setBarWidth(percent : number) : void {
		if (percent < 0 || percent > 1) {
			console.error("Warning: clamping bar width from", percent);
		}

		const clampPercent = Fns.clamp(0, percent, 1);
		this._model.onLoad((model : Model) => {		
			let bar = model.subMesh(SubMesh.BAR);
			bar.scaling.x = clampPercent;
			bar.position.x = (clampPercent - 1) / 2  * this._width;
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
		if (game.tablet(game.clientId())?.hasColor()) {
			return game.tablet(game.clientId()).color();
		}

		return NameTag._defaultPointerColor;
	}

	displayName() : string { return this._displayName.get(); }
	setDisplayName(displayName : string) : void {
		this._displayName.set(displayName);
	}

	setOscillateTime(oscillateTime : number) : void {
		this._oscillateTime = Math.max(0, oscillateTime);

		if (this._oscillateTime === 0) {
			this._oscillation = 0;
		}
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
	setTagVisible(visible : boolean) : void {
		this._model.onLoad((model : Model) => {
			model.mesh().isVisible = visible;
		});
	}
	private setEnabled(enabled : boolean) : void {
		if (this._enabled === enabled) {
			return;
		}

		this._enabled = enabled;
		this._model.setVisible(this._visible && this._enabled);
	}

	override attachType() : AttachType { return AttachType.ROOT; }

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this._oscillateTime > 0) {

			this._oscillation += millis / this._oscillateTime;
			this._model.translation().y = 0.1 * Math.sin(this._oscillation * 2 * Math.PI);

			if (this._oscillation > 1) {
				this._oscillation = this._oscillation % 1;
			}
		}
	}

	override preRender() : void {
		super.preRender();

		let enabled = true;
		if (this.owner().isLakituTarget() || this.owner().state() === GameObjectState.DEACTIVATED) {
			// Don't show self or deactivated objs
			enabled = false;
		} else if (game.playerState().sameTeam(this.owner().team())) {
			// Same team should be able to see
			enabled = true;
		} else if (this.owner().hasProfile() && !this.owner().profile().visible()) {
			// Don't show if occluded
			enabled = false;
		} else if (game.playerState().validTargetEntity()
			&& this.owner().getAttribute(AttributeType.UNDERWATER)
			&& !game.playerState().targetEntity().getAttribute(AttributeType.UNDERWATER)) {
			// Don't underwater nametags unless also underwater
			enabled = false;
		} else if (this.owner().type() === EntityType.PLAYER && this.owner().dead()) {
			// Don't show when dead
			enabled = false;
		}
		this.setEnabled(enabled);
	}
}
