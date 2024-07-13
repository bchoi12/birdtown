
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity } from 'game/entity'
import { SoundType } from 'game/factory/api'
import { SoundFactory } from 'game/factory/sound_factory'

export class SoundPlayer extends ComponentBase implements Component {

	private _sounds : Map<number, BABYLON.Sound>;

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

	registerSound(id : number, type : SoundType, options? : BABYLON.ISoundOptions) : void {
		if (this._sounds.has(id)) {
			console.error("Error: skipped registering duplicate %s with id %d", SoundType[type], id);
			return;
		}

		this._sounds.set(id, SoundFactory.load(type, options));
	}
	onEnded(id : number) : BABYLON.Observable<BABYLON.Sound> {
		if (!this.hasSound(id)) {
			console.error("Error: tried to set onEnded for non-existent sound %d", id);
			return;
		}

		return this.sound(id).onEndedObservable;
	}

	hasSound(id : number) : boolean { return this._sounds.has(id); }
	sound(id : number) : BABYLON.Sound { return this._sounds.get(id); }

	playFromSelf(id : number, options? : BABYLON.ISoundOptions) : void {
		this.playFromEntity(id, this.entity(), options);
	}

	playFromEntity(id : number, entity : Entity, options? : BABYLON.ISoundOptions) : void {
		if (entity.isLakituTarget()) {
			// Disable spatial sound when originating from the target.
			const resolvedOptions = {
				spatialSound: false,				
				...(options ? options : {}),
			}
			let sound = this.prepareSound(id, resolvedOptions);
			sound.play();
		} else {
			// Play sound at distance, prefer following the mesh when possible.
			let sound = this.prepareSound(id, options);
			if (entity.hasModel()) {
				entity.model().onLoad((model : Model) => {
					sound.attachToMesh(model.mesh());
					sound.play();
				});
			} else if (entity.hasProfile()) {
				sound.setPosition(this.entity().profile().getRenderPos().toBabylon3());
				sound.play();
			}
		}
	}
	play(id : number, options? : BABYLON.ISoundOptions) : void {
		if (!this.hasSound(id)) {
			console.error("Error: tried to play non-existent sound %d", id);
			return;
		}

		let sound = this.prepareSound(id, options);
		sound.play();
	}
	stop(id : number) : void {
		if (!this.hasSound(id)) {
			console.error("Error: tried to stop non-existent sound %d", id);
			return;
		}

		this.sound(id).stop();
	}

	private prepareSound(id : number, options? : BABYLON.ISoundOptions) : BABYLON.Sound {
		let sound = this.sound(id);
		if (options) {
			sound.updateOptions(options);
		}
		return sound;
	}
}