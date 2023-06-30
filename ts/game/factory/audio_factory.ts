import * as BABYLON from "babylonjs";

import { game } from 'game'
import { AudioType } from 'game/factory/api'

type AudioMetadata = {
	path : string;
}

export namespace AudioFactory {
	export const metadata = new Map<AudioType, AudioMetadata>([
		[AudioType.EXPLOSION, {
			path: "sound/explosion.wav",
		}],
	]);

	const nextId = new Map<AudioType, number>();
	export function load(type : AudioType) : BABYLON.Sound {
		if (!metadata.has(type)) {
			console.error("Error: audio type %d is missing metadata", type);
			return null;
		}

		const id = nextId.has(type) ? nextId.get(type) : 1;
		nextId.set(type, id + 1);
		return new BABYLON.Sound("audio-" + type + "[" + id + "]", metadata.get(type).path, game.world().scene());
	}
}