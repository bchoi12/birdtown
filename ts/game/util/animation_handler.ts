import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { AnimationSet } from 'game/util/animation_set'

import { defined } from 'util/common'

export class AnimationHandler {

	private _animations : Map<string, BABYLON.AnimationGroup>;
	private _animationGroups : Map<string, number>;
	private _animationSets : Map<number, AnimationSet>;

	constructor() {
		this._animations = new Map();
		this._animationGroups = new Map();
		this._animationSets = new Map();
	}

	register(animation : BABYLON.AnimationGroup, group? : number) {
		const name = animation.name;
		if (this._animations.has(name)) {
			console.log("Warning: skipping duplicate animation " + name);
			return;
		}

		this._animations.set(name, animation);

		if (!defined(group)) {
			return;
		}

		if (!this._animationSets.has(group)) {
			this._animationSets.set(group, new AnimationSet());
		}

		this._animationSets.get(group).add(name, animation);
		this._animationGroups.set(name, group);
	}

	play(name : string, loop? : boolean) : void {
		if (!this._animations.has(name)) {
			return;
		}

		if (this._animations.get(name).isPlaying) {
			return;
		}

		if (this._animationGroups.has(name)) {
			let set = this._animationSets.get(this._animationGroups.get(name));
			set.play(name, loop);
		} else {
			this._animations.get(name).play(loop);
		}
	}

	stopAll() : void {
		this._animations.forEach((animation : BABYLON.AnimationGroup) => {
			animation.stop();
		});
	}
}