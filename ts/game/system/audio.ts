import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { MusicType } from 'game/factory/api'
import { MusicFactory } from 'game/factory/music_factory'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { settings } from 'settings'

import { ui } from 'ui'

import { Optional } from 'util/optional'

export class Audio extends SystemBase implements System {

	private static readonly _fadeSecs = 1;

	private _music : Optional<BABYLON.Sound>;
	private _currentType : MusicType;
	private _queuedType : MusicType;

	constructor() {
		super(SystemType.AUDIO);

		this._music = new Optional();
		this._currentType = MusicType.UNKNOWN;
		this._queuedType = MusicType.UNKNOWN;

		this.addProp<MusicType>({
			import: (obj : MusicType) => { this.queueMusic(obj); },
			export: () => { return this._queuedType; },
		})
	}

	queueMusic(type : MusicType) : void {
		if (!ui.hasAudio()) {
			return;
		}
		if (this._music.has() && this._queuedType === type) {
			return;
		}

		this._queuedType = type;
		if (this._music.has()) {
			this._music.get().setVolume(0, Audio._fadeSecs);
			setTimeout(() => {
				this.nextTrack();
			}, Audio._fadeSecs * 1000);
		} else {
			this.nextTrack();
		}
	}

	stopMusic() : void {
		if (this._music.has()) {
			this._music.get().stop();
		}
		this._currentType = MusicType.UNKNOWN;
		this._queuedType = MusicType.UNKNOWN;
	}

	private nextTrack() : void {
		if (this._queuedType = MusicType.UNKNOWN) {
			this._currentType = MusicType.UNKNOWN;
			return;
		}
		if (this._music.has() && this._currentType === this._queuedType) {
			return;
		}

		let music = MusicFactory.load(this._queuedType);
		if (music === null) {
			console.error("Error: failed to load music %s", MusicType[this._queuedType]);
			return;
		}

		this._currentType = this._queuedType;
		this._music.set(music);
		music.setVolume(settings.musicVolume() * music.getVolume());
		music.play();
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