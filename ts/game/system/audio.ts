import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { AudioType } from 'game/factory/api'
import { AudioFactory } from 'game/factory/audio_factory'
import { System, SystemBase } from 'game/system'
import { SystemType, MusicType, SoundType } from 'game/system/api'
import { EntityQuery } from 'game/util/entity_query'

import { ui } from 'ui'

import { defined } from 'util/common'
import { ObjectCache } from 'util/object_cache'
import { SeededRandom } from 'util/seeded_random'

type SoundFn = () => AudioType;

export class Audio extends SystemBase implements System {

	private _players : EntityQuery;
	private _rng : SeededRandom;
	private _audioCache : Map<AudioType, ObjectCache<BABYLON.Sound>>; 
	private _sounds : Map<SoundType, SoundFn>;

	constructor() {
		super(SystemType.AUDIO);

		this._players = new EntityQuery();
		this._players.registerQuery<Player>(EntityType.PLAYER, {
			query: (player : Player) => { return player.initialized(); },
			maxStaleness: 250,
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

		this._sounds = new Map<SoundType, SoundFn>([
			[SoundType.BAWK, () => {
				return AudioType.BAWK;
			}],
			[SoundType.EXPLOSION, () => {
				return AudioType.EXPLOSION;
			}],
		]);
	}

	loadSound(soundType : SoundType, onLoad? : (sound : BABYLON.Sound) => void, onEnded? : () => void) : void {
		if (!this._sounds.has(soundType)) {
			console.error("Error: attempting to play unregistered sound %s", SoundType[soundType]);
			return;
		}

		const audioType = this._sounds.get(soundType)();
		if (!this._audioCache.has(audioType)) {
			console.error("Error: audio cache is not initialized for %s", AudioType[audioType]);
			return;
		}

		let cache = this._audioCache.get(audioType);

		// TODO: set volume and other global settings
		let audio = cache.borrow(onLoad);
		audio.onEndedObservable.addOnce(() => {
			cache.return(audio);
			if (onEnded) {
				onEnded();
			}
		});
	}

	override preRender() : void {
		super.preRender();

		// Set sound positions
		this._players.query<Player>(EntityType.PLAYER).forEach((player : Player) => {
			ui.updatePos(player.clientId(), player.getProfile().pos());
		});
		if (game.lakitu().hasTargetEntity()) {
			ui.updatePos(game.clientId(), game.lakitu().targetEntity().getProfile().pos())
		}
	}
}