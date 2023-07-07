import * as BABYLON from "babylonjs";

import { game } from 'game'
import { AudioType } from 'game/factory/api'

import { AudioGlobals } from 'global/audio_globals'

import { defined } from 'util/common'

type AudioMetadata = {
	path : string;
	spatial? : boolean;
}

export namespace AudioFactory {
	export const metadata = new Map<AudioType, AudioMetadata>([
		[AudioType.EXPLOSION, {
			path: "sound/explosion.wav",
			spatial: true,
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
			"audio-" + type + "[" + id + "]",
			"audio/" + metadata.get(type).path,
			game.world().scene(),
			defined(onLoad) ? () => { onLoad(sound); } : null,
			metadata.get(type).spatial ? AudioGlobals.spatialGameOptions : {});

		if (AudioGlobals.panningModel === "HRTF") {
			sound.switchPanningModelToHRTF();
		}
		return sound;
	}
}