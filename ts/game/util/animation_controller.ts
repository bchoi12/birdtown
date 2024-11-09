import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AnimationSet } from 'game/util/animation_set'

import { defined } from 'util/common'

export type PlayOptions = {
	loop? : boolean;
	speedRatio? : number;
}

export class AnimationController {

	private _animations : Map<string, BABYLON.AnimationGroup>;
	private _animationSetIds : Map<string, number>;
	private _animationSets : Map<number, AnimationSet>;

	constructor() {
		this._animations = new Map();
		this._animationSetIds = new Map();
		this._animationSets = new Map();
	}

	animationSet(group : number) : AnimationSet { return this._animationSets.get(group); }

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
		this._animationSetIds.set(name, group);
	}

	play(name : string, options? : PlayOptions) : void {
		if (!this._animations.has(name)) {
			return;
		}


		if (!options) {
			options = {};
		}

		if (options.speedRatio) {
			this._animations.get(name).speedRatio = options.speedRatio * game.runner().updateSpeed();
		} else {
			this._animations.get(name).speedRatio = game.runner().updateSpeed();
		}

		if (this._animations.get(name).isPlaying) {
			return;
		}

		if (this._animationSetIds.has(name)) {
			let set = this._animationSets.get(this._animationSetIds.get(name));
			set.play(name, options);
		} else {
			this._animations.get(name).play(options.loop);
		}
	}

	stopAll() : void {
		this._animations.forEach((animation : BABYLON.AnimationGroup) => {
			animation.stop();
		});
	}
}