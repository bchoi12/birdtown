import * as BABYLON from '@babylonjs/core/Legacy/legacy'

export class AnimationSet {

	private _map : Map<string, BABYLON.AnimationGroup>;

	constructor() {
		this._map = new Map();
	}

	add(name : string, animation : BABYLON.AnimationGroup) {
		this._map.set(name, animation);
	}

	play(requestedName : string, loop? : boolean) {
		this._map.forEach((animation : BABYLON.AnimationGroup, name : string) => {
			if (requestedName === name) {
				animation.play(loop);
			} else {
				animation.stop();
			}
		});
	}
}