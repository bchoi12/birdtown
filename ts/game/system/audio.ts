import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { MusicType } from 'game/factory/api'
import { MusicFactory } from 'game/factory/music_factory'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType, AmbianceType } from 'game/system/api'

import { settings } from 'settings'

import { ui } from 'ui'

import { isLocalhost } from 'util/common'
import { Optional } from 'util/optional'
import { globalRandom } from 'util/seeded_random'

export class Audio extends SystemBase implements System {

	private _music : Optional<BABYLON.Sound>;
	private _ambiance : AmbianceType;
	private _ambianceTracks : Map<AmbianceType, Array<MusicType>>;
	private _ambianceIndex : Map<AmbianceType, number>;
	private _currentType : MusicType;
	private _queuedType : MusicType;

	constructor() {
		super(SystemType.AUDIO);

		this._music = new Optional();

		this._ambiance = AmbianceType.UNKNOWN;
		this._ambianceTracks = new Map<AmbianceType, Array<MusicType>>([
			[AmbianceType.UPBEAT, globalRandom.shuffle([
				MusicType.CULMINATION,
				MusicType.GEAR_HEAD,
				MusicType.POPCORN,
			])],
			[AmbianceType.DRAMATIC, globalRandom.shuffle([
				MusicType.EPIC_FUNKY,
				MusicType.EPIC_THEME,
				MusicType.EXTREME_EDGE,
			])],
		]);
		this._ambianceIndex = new Map();
		this._currentType = MusicType.UNKNOWN;
		this._queuedType = MusicType.UNKNOWN;

		this.addProp<AmbianceType>({
			import: (obj : AmbianceType) => { this._ambiance = obj; },
			export: () => { return this._ambiance; },
		})
		this.addProp<MusicType>({
			import: (obj : MusicType) => { this.queueMusic(obj); },
			export: () => { return this._queuedType; },
		})
	}

	setAmbiance(type : AmbianceType) : void {
		if (this._ambiance === type) {
			return;
		}
		if (!this._ambianceTracks.has(type)) {
			console.error("Error: %s does not have any entries", AmbianceType[type]);
			return;
		}

		this._ambiance = type;
		if (!this._ambianceIndex.has(type)) {
			this._ambianceIndex.set(type, 0);
		}

		const index = this._ambianceIndex.get(type);
		this._ambianceIndex.set(type, index + 1);
		const trackList = this._ambianceTracks.get(type);
		game.audio().queueMusic(trackList[index % trackList.length]);
	}

	private queueMusic(type : MusicType) : void {
		if (this._music.has() && this._queuedType === type) {
			return;
		}

		this._queuedType = type;
		if (isLocalhost()) {
			console.log("Audio: queued %s", MusicType[this._queuedType]);
		}

		if (!ui.hasAudio()) {
			return;
		}

		if (this._music.has()) {
			this._music.get().setVolume(0, MusicFactory.fadeSecs);
			setTimeout(() => {
				this.nextTrack();
			}, MusicFactory.fadeSecs * 1000);
		} else {
			this.nextTrack();
		}
	}

	onAudioEnabled() : void {
		if (this._queuedType !== MusicType.UNKNOWN) {
			this.queueMusic(this._queuedType);
		}
	}

	fadeMusic() : void {
		this._ambiance = AmbianceType.UNKNOWN;
		this.queueMusic(MusicType.UNKNOWN);
	}

	private stopMusic() : void {
		if (this._music.has()) {
			this._music.get().stop();
			this._music.clear();
		}
		this._currentType = MusicType.UNKNOWN;
		this._queuedType = MusicType.UNKNOWN;
	}

	refreshSettings() : void {
		if (!this._music.has()) {
			return;
		}
		this._music.get().setVolume(settings.musicVolume());
	}

	private nextTrack() : void {
		if (this._queuedType === MusicType.UNKNOWN) {
			this._currentType = MusicType.UNKNOWN;
			this.stopMusic();
			return;
		}
		if (this._music.has() && this._currentType === this._queuedType) {
			if (isLocalhost()) {
				console.log("Audio: already playing %s", MusicType[this._queuedType]);
			}
			return;
		}

		let music = MusicFactory.play(this._queuedType);
		if (music === null) {
			console.error("Error: failed to load music %s", MusicType[this._queuedType]);
			return;
		}

		this._currentType = this._queuedType;
		if (isLocalhost()) {
			console.log("Audio: playing %s", MusicType[this._currentType]);
		}
		this._music.set(music);
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		this.updateSound();
	}

	private updateSound() : void {
		// Set sound positions
		game.entities().getMap(EntityType.PLAYER).executeIf((player : Player) => {
			this.updatePos(player.clientId(), player);
		}, (player : Player) => {
			return player.valid();
		});
		if (game.lakitu().validTargetEntity()) {
			this.updatePos(game.clientId(), game.lakitu().targetEntity());
		}
	}

	private updatePos(id : number, target : Entity) : void {
		// Prefer mesh since sound will be attached to mesh.
		if (target.hasModel() && target.model().hasMesh()) {
			let pos = target.model().mesh().position;
			ui.updatePos(game.clientId(), {
				x: pos.x,
				y: pos.y,
				z: game.lakitu().camera().position.z / 3,
			});
		} else if (target.hasProfile()) {
			let pos = target.profile().getRenderPos();
			ui.updatePos(game.clientId(), {
				x: pos.x,
				y: pos.y,
				z: game.lakitu().camera().position.z / 3,
			});
		}
	}
}