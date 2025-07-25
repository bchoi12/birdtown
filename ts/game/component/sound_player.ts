
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity } from 'game/entity'
import { SoundType } from 'game/factory/api'
import { SoundFactory } from 'game/factory/sound_factory'

import { settings } from 'settings'

import { ui } from 'ui'

import { Vec } from 'util/vector'

export class SoundPlayer extends ComponentBase implements Component {

	private _sounds : Map<SoundType, BABYLON.Sound>;

	constructor() {
		super(ComponentType.SOUND_PLAYER);

		this._sounds = new Map();
	}

	override dispose() : void {
		super.dispose();

		this._sounds.forEach((sound : BABYLON.Sound) => {
			if (sound.loop) {
				sound.stop();
			}

			if (sound.metadata && sound.metadata.type) {
				SoundFactory.unload(sound.metadata.type, sound);
			}
		});
	}

	registerSound(type : SoundType) : void {
		if (this._sounds.has(type)) {
			console.error("Error: skipped registering duplicate %s with id %d", SoundType[type], type);
			return;
		}

		this._sounds.set(type, SoundFactory.preload(type));
	}
	onEnded(type : SoundType) : BABYLON.Observable<BABYLON.Sound> {
		if (!this.hasSound(type)) {
			console.error("Error: tried to set onEnded for non-existent sound %d", type);
			return;
		}

		return this.sound(type).onEndedObservable;
	}

	hasSound(type : SoundType) : boolean { return this._sounds.has(type); }
	sound(type : SoundType) : BABYLON.Sound { return this._sounds.get(type); }

	playFromSelf(type : SoundType, options? : BABYLON.ISoundOptions) : void {
		this.playFromEntity(type, this.entity(), options);
	}

	playFromEntity(type : SoundType, entity : Entity, options? : BABYLON.ISoundOptions) : void {
		if (entity === null || !entity.initialized()) {
			return;
		}
		if (!this.hasSound(type)) {
			console.error("Error: %s tried to play non-existent sound %d on %s", this.name(), type, entity.name());
			return;
		}
		if (!ui.hasAudio()) {
			return;
		}

		if (!options) {
			options = {};
		}
		if (!options.playbackRate) {
			options.playbackRate = 1;
		}
		options.playbackRate *= Math.max(0.3, game.runner().updateSpeed());
		if (SoundFactory.canDistort(type)) {
			options.playbackRate *= entity.playbackRate();
		}

		if (entity.isLakituTarget()) {
			// Default to no spatial sound when originating from the target.
			const resolvedOptions = {
				spatialSound: false,
				...options
			}
			let sound = this.prepareSound(type, resolvedOptions);
			sound.play();
		} else {
			// Play sound at distance, prefer following the mesh when possible.
			let sound = this.prepareSound(type, options);
			if (entity.hasModel() && entity.model().hasMesh()) {
				sound.attachToMesh(entity.model().mesh());
				sound.play();
			} else if (entity.hasProfile()) {
				sound.setPosition(entity.profile().getRenderPos().toBabylon3());
				sound.play();
			}
		}
	}
	playFromPos(type : SoundType, pos : Vec, options? : BABYLON.ISoundOptions) : void {
		if (!this.hasSound(type)) {
			console.error("Error: %s tried to play non-existent sound %d at", this.name(), type, pos);
			return;
		}
		if (!ui.hasAudio()) {
			return;
		}

		if (!options) {
			options = {};
		}

		let sound = this.prepareSound(type, options);
		sound.setPosition(new BABYLON.Vector3(pos.x, pos.y, pos.z));
		sound.play();
	}

	play(type : SoundType, options? : BABYLON.ISoundOptions) : void {
		if (!this.hasSound(type)) {
			console.error("Error: %s tried to play non-existent sound %d", this.name(), type);
			return;
		}
		if (!ui.hasAudio()) {
			return;
		}

		let sound = this.prepareSound(type, options);
		sound.play();
	}
	stop(type : SoundType) : void {
		if (!this.hasSound(type)) {
			console.error("Error: %s tried to stop non-existent sound %d", this.name(), type);
			return;
		}

		this.sound(type).stop();
	}

	private prepareSound(type : SoundType, options? : BABYLON.ISoundOptions) : BABYLON.Sound {
		let sound = this.sound(type);
		if (options) {
			sound.updateOptions(options);
		} 

		let volume = (options && options.volume) ? options.volume : 1;
		sound.setVolume(settings.soundVolume() * volume);

		return sound;
	}
}