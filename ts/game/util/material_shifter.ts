import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { Box2 } from 'util/box'
import { Vec, Vec2 } from 'util/vector'

type Material = BABYLON.PBRMaterial;

export class MaterialShifter {
	
	private _size : Box2;
	private _offsets : Map<number, Vec2>;

	private _material : Material;

	constructor() {
		this._size = Box2.zero();
		this._offsets = new Map();

		this._material = null;
	}

	setMaterial(material : Material, size : Box2) {
		if (!material.albedoTexture) {
			console.error("Error: material missing albedoTexture", material);
			return;
		}
		let texture = <BABYLON.Texture>material.albedoTexture;
		if (!texture || !texture.hasOwnProperty("uOffset") || !texture.hasOwnProperty("vOffset")) {
			console.error("Error: material has unsupported texture", texture);
			return;
		}

		this._material = material;
		this._size.copyBox2(size);
	}
	hasValidMaterial() : boolean { return this._material !== null; }
	getTexture() : BABYLON.Texture { return <BABYLON.Texture>this._material.albedoTexture; }

	registerOffset(id : number, offset : Vec) : void {
		if (!this._size.contains(offset)) {
			console.error("Error: skipping attempt to register offset outside of bounds", offset, this._size);
			return;
		}

		this._offsets.set(id, Vec2.fromVec(offset));
	}

	offset(id : number) : void {
		if (!this._offsets.has(id)) {
			console.error("Error: skipping attempt to use unregistered offset", id);
			return;
		}
		if (!this.hasValidMaterial()) {
			return;
		}

		let texture = this.getTexture();
		const offset = this._offsets.get(id);
		texture.uOffset = this._size.min.x + (offset.x - this._size.min.x) / this._size.width();
		texture.vOffset = this._size.min.y + (offset.y - this._size.min.y) / this._size.height();
	}
}