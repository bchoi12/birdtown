
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Block } from 'game/entity/block'
import { ColorCategory, ColorType, DepthType, MaterialType, MeshType, TextureType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { TextureFactory } from 'game/factory/texture_factory'

import { Vec } from 'util/vector'

export class Billboard extends Block {

	private static readonly _textures = new Array<TextureType>(
		TextureType.BILLBOARD_BOOBY,
		TextureType.BILLBOARD_DUCK,
		TextureType.BILLBOARD_HENRY,
	);

	private _textureType : TextureType;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BILLBOARD, entityOptions);

		this._hexColors.setColor(ColorCategory.BASE, ColorFactory.color(ColorType.WHITE).toHex());

		this._textureType = TextureType.UNKNOWN;
		if (this.isSource()) {
			this._textureType = Billboard._textures[Math.floor(Math.random() * Billboard._textures.length)];
		}

		this.addProp<TextureType>({
			has: () => { return this._textureType !== TextureType.UNKNOWN; },
			export: () => { return this._textureType; },
			import: (obj : TextureType) => { this._textureType = obj; },
		});
	}

	override ready() : boolean { return super.ready() && this._textureType !== TextureType.UNKNOWN; }

	override initialize() : void {
		super.initialize();

		this._profile.setMinimapOptions({
			color: this._hexColors.color(ColorCategory.BASE).toString(),
			depthType: DepthType.FRONT,
		});
	}

	override meshType() : MeshType { return MeshType.BILLBOARD; }
	override thickness() : number { return 0; }

	protected override processMesh(mesh : BABYLON.Mesh) : void {
		super.processMesh(mesh);

		if (!mesh.material) {
			return;
		}

		if (mesh.material.name === "ad-front") {
			if (mesh.material instanceof BABYLON.PBRMaterial) {
				(<BABYLON.Texture>mesh.material.albedoTexture).updateURL(TextureFactory.getURL(this._textureType));
			}
		}
	}
}