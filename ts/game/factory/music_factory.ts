import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { MusicType } from 'game/factory/api'

import { MediaGlobals } from 'global/media_globals'

import { settings } from 'settings'

import { ui } from 'ui'

type MusicMetadata = {
	path : string;
	attribution : string;
	track : string;
	artist : string;
	options : BABYLON.ISoundOptions;
}

export namespace MusicFactory {

	const metadata = new Map<MusicType, MusicMetadata>([
		[MusicType.ABSOLUTION, {
			path: "absolution.mp3",
			attribution: "Music by https://www.steven-obrien.net/",
			track: "Absolution",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.CULMINATION, {
			path: "culmination.mp3",
			attribution: "Music by https://www.steven-obrien.net/",
			track: "Culmination",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.EPIC_HEIGHTS, {
			path: "epic_heights.mp3",
			attribution: "Music by https://www.steven-obrien.net/",
			track: "Epic Heights",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.EPIC_THEME, {
			path: "epic_theme.mp3",
			attribution: "Music by https://www.steven-obrien.net/",
			track: "Epic Theme No. 1",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.FIGHT, {
			path: "fight.mp3",
			attribution: "Music by https://www.steven-obrien.net/",
			track: "Fight to the Death",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.GEAR_HEAD, {
			path: "gear_head.mp3",
			attribution: "Music by https://www.steven-obrien.net/",
			track: "Gear Head",
			artist: "Steven O'brien",
			options: {}
		}],
		[MusicType.POPCORN, {
			path: "popcorn.mp3",
			attribution: "Music by https://www.steven-obrien.net/",
			track: "Popcorn",
			artist: "Steven O'brien",
			options: {}
		}],
	]);


	export function load(type : MusicType, options? : BABYLON.ISoundOptions) : BABYLON.Sound {
		if (!metadata.has(type)) {
			console.error("Error: sound type %d is missing metadata", type);
			return null;
		}

		const meta = metadata.get(type);
		let music = new BABYLON.Sound(
			"music-" + MusicType[type],
			"music/" + meta.path,
			game.scene(),
			null,
			MediaGlobals.gameOptions);

		const resolvedOptions = {
			...MediaGlobals.gameOptions,
			...metadata.get(type).options,
			volume: settings.musicVolume(),
			...(options ? options : {}),
		};
		music.updateOptions(resolvedOptions);
		return music;
	}

	export function play(type : MusicType, options? : BABYLON.ISoundOptions) : void {
		if (!ui.hasAudio()) {
			return;
		}

		let music = load(type, options);
		if (music !== null) {
			music.setVolume(settings.musicVolume() * music.getVolume());
			music.play();
		}
	}
}