import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Entity } from 'game/entity'
import { SoundType } from 'game/factory/api'

import { MediaGlobals } from 'global/media_globals'

import { settings } from 'settings'

import { ui } from 'ui'

import { ObjectCache } from 'util/object_cache'

type SoundMetadata = {
	path : string;
	options : BABYLON.ISoundOptions;
	cacheSize? : number;

	// Only allow playbackRate change from game speed
	disallowDistortion? : boolean;
}

export namespace SoundFactory {

	let soundCache = new Map<SoundType, ObjectCache<BABYLON.Sound>>();
	const cacheSize = 3;

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
			disallowDistortion: true,
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
		[SoundType.CLICK, {
			path: "click.mp3",
			options: {},
		}],
		[SoundType.CINEMATIC_WOOSH, {
			path: "cinematic_woosh.mp3",
			disallowDistortion: true,
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.CRATE, {
			path: "crate.mp3",
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
		[SoundType.GOLDEN_GUN, {
			path: "golden_gun.mp3",
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
			disallowDistortion: true,
			options: {
				spatialSound: true,
			},
		}],
		[SoundType.MACHINE_GUN, {
			path: "machine_gun.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.MINIGUN, {
			path: "minigun.mp3",
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
		[SoundType.RIFLE, {
			path: "rifle.mp3",
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
		[SoundType.SCIFI_RELOAD, {
			path: "scifi_reload.mp3",
			options: {},
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
		[SoundType.SPLASH_IN, {
			path: "splash_in.mp3",
			options: {
				spatialSound: true,
			}
		}],
		[SoundType.SPLASH_OUT, {
			path: "splash_out.mp3",
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
		[SoundType.TABLE_FLIP, {
			path: "table_flip.mp3",
			options: {
				spatialSound: true,
			}
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
		[SoundType.TUMBLE, {
			path: "tumble.mp3",
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

	function initCache(type : SoundType, autoplay? : boolean) : void {
		const meta = metadata.get(type);
		soundCache.set(type, new ObjectCache<BABYLON.Sound>({
			createFn: (index : number) => {
				let sound = new BABYLON.Sound(
					"sound-" + SoundType[type] + "[" + index + "]",
					"sound/" + meta.path,
					game.scene(),
					() => {
						if (autoplay) {
							sound.play();
						}
					},
					getOptions(type));
				sound.metadata = {
					type: type,
				};
				return sound;
			},
			maxSize: meta.cacheSize > 0 ? meta.cacheSize : cacheSize,
		}));
	}

	function load(type : SoundType, autoplay? : boolean) : BABYLON.Sound {
		if (!metadata.has(type)) {
			console.error("Error: sound type %d is missing metadata", type);
			return null;
		}

		if (!soundCache.has(type)) {
			initCache(type, autoplay);
		}
		return soundCache.get(type).borrow();
	}

	export function preload(type : SoundType) : BABYLON.Sound {
		return load(type, false);
	}

	export function unload(type : SoundType, sound : BABYLON.Sound) : void {
		if (!soundCache.has(type)) {
			console.error("Warning: unloaded %s to non-existent cache", SoundType[type]);
			initCache(type);
		}
		soundCache.get(type).return(sound);
	}

	export function canDistort(type : SoundType) : boolean {
		if (!metadata.has(type)) {
			return false;
		}
		return !metadata.get(type).disallowDistortion;
	}

	export function play(type : SoundType, options? : BABYLON.ISoundOptions) : void {
		if (!ui.hasAudio()) {
			return;
		}

		let sound = load(type, true);
		if (sound === null) {
			return;
		}

		sound.updateOptions(getOptions(type, options));
		sound.play();
		unload(type, sound);
	}

	export function playFromPos(type : SoundType, pos : BABYLON.Vector3, options? : BABYLON.ISoundOptions) : void {
		if (!ui.hasAudio()) {
			return;
		}

		let sound = load(type, true);
		if (sound === null) {
			return;
		}

		sound.setPosition(pos);
		sound.updateOptions(getOptions(type, options));
		sound.play();
		unload(type, sound);
	}

	export function playFromEntity(type : SoundType, entity : Entity, options? : BABYLON.ISoundOptions) : void {
		if (!ui.hasAudio()) {
			return;
		}

		let sound = load(type, true);
		if (sound === null) {
			return;
		}

		if (entity === null || !entity.initialized()) {
			return;
		}

		let resolvedOptions = getOptions(type, options)
		resolvedOptions.playbackRate *= entity.playbackRate() * Math.max(0.3, game.runner().updateSpeed());
		if (entity.isLakituTarget()) {
			// Default to no spatial sound when originating from the target.
			resolvedOptions.spatialSound = false;
		} else {
			// Play sound at distance, prefer following the mesh when possible.
			if (entity.hasModel() && entity.model().hasMesh()) {
				sound.attachToMesh(entity.model().mesh());
			} else if (entity.hasProfile()) {
				sound.setPosition(entity.profile().getRenderPos().toBabylon3());
			} else {
				return;
			}
		}

		sound.updateOptions(resolvedOptions);
		sound.play();
		unload(type, sound);
	}

	function hasSound(type : SoundType) : boolean {
		return soundCache.has(type) && soundCache.get(type).size() > 0;
	}
	function getOptions(type : SoundType, options? : BABYLON.ISoundOptions) : BABYLON.ISoundOptions {
		return {
			...MediaGlobals.gameOptions,
			...metadata.get(type).options,
			playbackRate: 1,
			volume: settings.soundVolume(),
			...(options ? options : {}),
		};
	}
}