import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { SoundType } from 'game/factory/api'

import { MediaGlobals } from 'global/media_globals'

import { settings } from 'settings'

import { ui } from 'ui'

import { ObjectCache } from 'util/object_cache'

type SoundMetadata = {
	path : string;
	options : BABYLON.ISoundOptions;
	cacheSize? : number
}

export namespace SoundFactory {

	let soundCache = new Map<SoundType, ObjectCache<BABYLON.Sound>>();
	const cacheSize = 5;

	const metadata = new Map<SoundType, SoundMetadata>([
		[SoundType.BAWK, {
			path: "bawk.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.BIRD_SONG, {
			path: "bird_song.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.BLAST, {
			path: "blast.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.BOLT, {
			path: "bolt.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.BOOM, {
			path: "boom.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.BOOST, {
			path: "boost.mp3",
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
		[SoundType.CHARGED_BOLT, {
			path: "charged_laser.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.CHAT, {
			path: "chat.mp3",
			options: {},
		}],
		[SoundType.CINEMATIC_WOOSH, {
			path: "cinematic_woosh.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.DASH, {
			path: "dash.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.EAGLE_SCREECH, {
			path: "eagle_screech.mp3",
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
		[SoundType.FOOTSTEP, {
			path: "footstep.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.GATLING, {
			path: "gatling.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.JETPACK, {
			path: "jetpack.mp3",
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
		[SoundType.PLAYER_THUD, {
			path: "player_thud.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.PUNCH, {
			path: "punch.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.QUACK, {
			path: "quack.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.QUICK_RELOAD, {
			path: "quick_reload.mp3",
			options: {},
		}],
		[SoundType.RELOAD, {
			path: "reload.mp3",
			options: {},
		}],
		[SoundType.ROCKET, {
			path: "rocket.mp3",
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.SCREAM, {
			path: "scream.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.SMALL_EXPLOSION, {
			path: "small_explosion.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.SQUAWK, {
			path: "squawk.mp3",
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
		[SoundType.THUD, {
			path: "thud.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.WING_CANNON, {
			path: "wing_cannon.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.WOOD_THUD, {
			path: "wood_thud.mp3",
			options: {
				spatialSound: true,
			}
		}],
	]);

	function initCache(type : SoundType) : void {
		const meta = metadata.get(type);
		soundCache.set(type, new ObjectCache<BABYLON.Sound>({
			createFn: (index : number) => {
				let sound = new BABYLON.Sound(
					"sound-" + SoundType[type] + "[" + index + "]",
					"sound/" + meta.path,
					game.scene(),
					null,
					MediaGlobals.gameOptions);
				sound.metadata = {
					type: type,
				};
				return sound;
			},
			maxSize: meta.cacheSize > 0 ? meta.cacheSize : cacheSize,
		}));

		load(type);
	}

	export function load(type : SoundType, options? : BABYLON.ISoundOptions) : BABYLON.Sound {
		if (!metadata.has(type)) {
			console.error("Error: sound type %d is missing metadata", type);
			return null;
		}

		if (!soundCache.has(type)) {
			initCache(type);
		}

		const primeSound = soundCache.get(type).size() === 0;

		let sound = soundCache.get(type).borrow();
		const resolvedOptions = {
			...MediaGlobals.gameOptions,
			...metadata.get(type).options,
			volume: settings.soundVolume(),
			...(options ? options : {}),
		};
		sound.updateOptions(resolvedOptions);

		if (primeSound) {
			sound.play();
			sound.stop();
		}
		return sound;
	}

	export function unload(type : SoundType, sound : BABYLON.Sound) : void {
		if (!soundCache.has(type)) {
			console.error("Warning: unloaded %s to non-existent cache", SoundType[type]);
			initCache(type);
		}
		soundCache.get(type).return(sound);
	}

	export function play(type : SoundType, options? : BABYLON.ISoundOptions) : void {
		if (!ui.hasAudio()) {
			return;
		}

		let sound = load(type, options);

		if (sound !== null) {
			sound.setVolume(settings.soundVolume() * sound.getVolume());
			sound.play();
			unload(type, sound);
		}
	}

	export function playFromPos(type : SoundType, pos : BABYLON.Vector3, options? : BABYLON.ISoundOptions) : void {
		if (!ui.hasAudio()) {
			return;
		}

		let sound = load(type, options);

		if (sound !== null) {
			sound.setPosition(pos);
			sound.setVolume(settings.soundVolume() * sound.getVolume());
			sound.play();
			unload(type, sound);
		}
	}
}