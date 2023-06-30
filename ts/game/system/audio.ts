import * as BABYLON from "babylonjs";

import { AudioType } from 'game/factory/api'
import { AudioFactory } from 'game/factory/audio_factory'
import { System, SystemBase } from 'game/system'
import { SystemType, MusicType, SoundType } from 'game/system/api'

type SoundFn = () => BABYLON.Sound;

export class Audio extends SystemBase implements System {

	private _sounds : Map<SoundType, SoundFn>;

	constructor() {
		super(SystemType.AUDIO);

		this.setName({
			base: "audio",
		});

		this._sounds = new Map([
			[SoundType.EXPLOSION, () => {
				return AudioFactory.load(AudioType.EXPLOSION);
			}],
		]);

		// TODO: preload sounds?
	}

	playSound(type : SoundType) : BABYLON.Sound {
		if (!this._sounds.has(type)) {
			console.error("Error: attempting to play unregistered sound %d", type);
			return null;
		}

		let sound = this._sounds.get(type)();
		sound.play();
		return sound;
	}

	playMusic(type : MusicType) : BABYLON.Sound {
		console.error("Error: playMusic() is unimplemented");
		return null;
	}
}