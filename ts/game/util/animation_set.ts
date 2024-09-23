import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { PlayOptions } from 'game/util/animation_controller'

export class AnimationSet {

	private _map : Map<string, BABYLON.AnimationGroup>;

	constructor() {
		this._map = new Map();
	}

	add(name : string, animation : BABYLON.AnimationGroup) {
		this._map.set(name, animation);
	}

	play(requestedName : string, options : PlayOptions) {
		this._map.forEach((animation : BABYLON.AnimationGroup, name : string) => {
			if (requestedName === name) {
				animation.play(options.loop);
			} else {
				animation.stop();
			}
		});
	}
}