import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { MusicType } from 'game/factory/api'

import { MediaGlobals } from 'global/media_globals'

import { settings } from 'settings'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

type MusicMetadata = {
	path : string;
	attribution : string;
	track : string;
	artist : string;
	options : BABYLON.ISoundOptions;
}

export namespace MusicFactory {

	export const fadeSecs = 4;

	const metadata = new Map<MusicType, MusicMetadata>([
		[MusicType.CULMINATION, {
			path: "culmination.mp3",
			attribution: "steven-obrien.net",
			track: "Culmination",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.EPIC_FUNKY, {
			path: "epic_funky.mp3",
			attribution: "steven-obrien.net",
			track: "Epic Funky Rock Strings",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.EPIC_THEME, {
			path: "epic_theme.mp3",
			attribution: "steven-obrien.net",
			track: "Epic Theme No. 1",
			artist: "Steven O'brien",
			options: {
				volume: 0.8,
			}
		}],
		[MusicType.EXTREME_EDGE, {
			path: "extreme_edge.mp3",
			attribution: "steven-obrien.net",
			track: "Extreme Edge",
			artist: "Steven O'brien",
			options: {
				volume: 0.7,
			}
		}],
		[MusicType.GEAR_HEAD, {
			path: "gear_head.mp3",
			attribution: "steven-obrien.net",
			track: "Gear Head",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.POPCORN, {
			path: "popcorn.mp3",
			attribution: "steven-obrien.net",
			track: "Popcorn",
			artist: "Steven O'brien",
			options: {}
		}],
	]);


	export function play(type : MusicType) : BABYLON.Sound {
		if (!metadata.has(type)) {
			console.error("Error: music %s is missing metadata", MusicType[type]);
			return null;
		}

		const meta = metadata.get(type);
		let music = new BABYLON.Sound(
			"music-" + MusicType[type],
			"music/" + meta.path,
			game.scene(),
			() => {
				const resolvedOptions = {
					...MediaGlobals.gameOptions,
					...metadata.get(type).options,
					loop: true,
				};
				music.updateOptions(resolvedOptions);
				music.setVolume(0);
				music.play();

				let songVolume = metadata.get(type).options.volume ? metadata.get(type).options.volume : 1;

				music.setVolume(settings.musicVolume() * songVolume, fadeSecs);
			},
			MediaGlobals.gameOptions);

		ui.showTooltip(TooltipType.MUSIC, {
			ttl: 5000,
			names: [meta.track + " by " + meta.artist + "\n" + meta.attribution],
		});

		return music;
	}
}