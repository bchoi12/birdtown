import * as BABYLON from "babylonjs";

import { AudioType } from 'game/factory/api'
import { AudioFactory } from 'game/factory/audio_factory'
import { System, SystemBase } from 'game/system'
import { SystemType, MusicType, SoundType } from 'game/system/api'

import { defined } from 'util/common'
import { ObjectCache } from 'util/object_cache'
import { SeededRandom } from 'util/seeded_random'

type SoundFn = () => AudioType;

export class Audio extends SystemBase implements System {

	private _rng : SeededRandom;
	private _audioCache : Map<AudioType, ObjectCache<BABYLON.Sound>>; 
	private _sounds : Map<SoundType, SoundFn>;

	constructor() {
		super(SystemType.AUDIO);

		this.setName({
			base: "audio",
		});

		this._rng = new SeededRandom(333);

		this._audioCache = new Map();
		for (const stringType in AudioType) {
			const type = Number(AudioType[stringType]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			this._audioCache.set(type, new ObjectCache<BABYLON.Sound>({
				createFn: (onLoad? : (sound : BABYLON.Sound) => void) => {
					return AudioFactory.load(type, onLoad);
				},
			}));
		}

		this._sounds = new Map([
			[SoundType.EXPLOSION, () => {
				return AudioType.EXPLOSION_2;
			}],
		]);
	}

	loadSound(type : SoundType, onLoad? : (sound : BABYLON.Sound) => void) : void {
		if (!this._sounds.has(type)) {
			console.error("Error: attempting to play unregistered sound %d", type);
			return;
		}

		let cache = this._audioCache.get(this._sounds.get(type)());
		if (!defined(cache)) {
			console.error("Error: audio cache is not initialized for type %d", type);
			return;
		}

		// TODO: set volume and other global settings
		let sound = cache.borrow(onLoad);
		sound.onEndedObservable.addOnce(() => {
			cache.return(sound);
		});
	}
}