import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AudioType } from 'game/factory/api'

import { MediaGlobals } from 'global/media_globals'

import { defined } from 'util/common'

type AudioMetadata = {
	path : string;
	spatial? : boolean;
}

export namespace AudioFactory {
	export const metadata = new Map<AudioType, AudioMetadata>([
		[AudioType.EXPLOSION, {
			path: "sound/explosion.mp3",
			spatial: true,
		}],
		[AudioType.BAWK, {
		path: "sound/bawk.mp3",
			spatial: false,
		}],
	]);

	const nextId = new Map<AudioType, number>();
	export function load(type : AudioType, onLoad? : (sound : BABYLON.Sound) => void) : BABYLON.Sound {
		if (!metadata.has(type)) {
			console.error("Error: audio type %d is missing metadata", type);
			return null;
		}

		const id = nextId.has(type) ? nextId.get(type) : 1;
		nextId.set(type, id + 1);
		let sound = new BABYLON.Sound(
			"audio-" + AudioType[type] + "[" + id + "]",
			"audio/" + metadata.get(type).path,
			game.scene(),
			defined(onLoad) ? () => { onLoad(sound); } : null,
			metadata.get(type).spatial ? MediaGlobals.spatialGameOptions : {});

		return sound;
	}
}