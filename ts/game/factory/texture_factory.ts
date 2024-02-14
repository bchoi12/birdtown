import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { TextureType } from 'game/factory/api'

export namespace TextureFactory {

	const transparent = new Set([
		TextureType.BOOBY_EYE,
	]);

	const pathPrefix = "texture/";
	const fileExtension = ".png";

	const cache = new Map<TextureType, BABYLON.Texture>();

	export function loadCached(type : TextureType) : BABYLON.Texture {
		if (cache.has(type)) {
			return cache.get(type);
		}

		cache.set(type, loadNew(type));
		return cache.get(type);
	}

	export function loadNew(type : TextureType) : BABYLON.Texture {
		return new BABYLON.Texture(getURL(type));
	}

	export function getURL(type : TextureType) : string {
		return pathPrefix + TextureType[type].toLowerCase() + fileExtension;
	}

	export function isTransparent(type : TextureType) : boolean {
		return transparent.has(type);
	}
}
