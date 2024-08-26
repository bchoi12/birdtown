import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { SoundType } from 'game/factory/api'

import { MediaGlobals } from 'global/media_globals'

import { ObjectCache } from 'util/object_cache'

type SoundMetadata = {
	path : string;
	options : BABYLON.ISoundOptions;
}

export namespace SoundFactory {

	let soundCache = new Map<SoundType, ObjectCache<BABYLON.Sound>>();

	export const metadata = new Map<SoundType, SoundMetadata>([
		[SoundType.BAWK, {
			path: "bawk.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.CHARGE, {
			path: "charge.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.CHARGED_LASER, {
			path: "charged_laser.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.EXPLOSION, {
			path: "explosion.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.LASER, {
			path: "laser.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.PISTOL, {
			path: "pistol.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.ROCKET, {
			path: "rocket.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.THROW, {
			path: "throw.mp3",
			options: {
				spatialSound: true,
			}
		}],
	]);

	function initCache(type : SoundType) : void {
		soundCache.set(type, new ObjectCache<BABYLON.Sound>({
			createFn: (index : number) => {
				let sound = new BABYLON.Sound(
					"sound-" + SoundType[type] + "[" + index + "]",
					"sound/" + metadata.get(type).path,
					game.scene(),
					null,
					MediaGlobals.gameOptions);
				sound.metadata = {
					type: type,
				};
				return sound;
			},
			maxSize: 3,
		}));
	}

	export function load(type : SoundType, options? : BABYLON.ISoundOptions) : BABYLON.Sound {
		if (!metadata.has(type)) {
			console.error("Error: sound type %d is missing metadata", type);
			return null;
		}

		if (!soundCache.has(type)) {
			initCache(type);
		}

		let sound = soundCache.get(type).borrow();
		const resolvedOptions = {
			...MediaGlobals.gameOptions,
			...metadata.get(type).options,
			...(options ? options : {}),
		};
		sound.updateOptions(resolvedOptions);
		return sound;
	}

	export function unload(type : SoundType, sound : BABYLON.Sound) : void {
		if (!soundCache.has(type)) {
			console.error("Warning: unloaded %s to non-existent cache", SoundType[type]);
			initCache(type);
		}
		soundCache.get(type).return(sound);
	}
}