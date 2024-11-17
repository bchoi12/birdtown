
import { Component, ComponentBase } from 'game/component'
import { ComponentType, EmotionType } from 'game/component/api'
import { StepData } from 'game/game_object'

import { Fns, InterpType } from 'util/fns'
import { Optional } from 'util/optional'
import { Timer } from 'util/timer'

export class Expression extends ComponentBase implements Component {

	private static readonly _durations = new Map<EmotionType, number>([
		[EmotionType.MAD, 1500],
		[EmotionType.SAD, 1500],
	]);

	private _current : EmotionType;
	private _emotions : Map<EmotionType, number>;

	constructor() {
		super(ComponentType.EXPRESSION);

		this._current = EmotionType.NORMAL;
		this._emotions = new Map();
	}

	override reset() : void {
		super.reset();

		this._current = EmotionType.NORMAL;
		this._emotions.clear();
	}

	emotion() : EmotionType { return this._current; }
	private value(type : EmotionType) : number {  return this._emotions.has(type) ? this._emotions.get(type) : 0; }
	private fade(type : EmotionType, millis : number) : number {
		if (!this._emotions.has(type) || !Expression._durations.has(type)) {
			return 0;
		}

		const value = Math.max(0, this._emotions.get(type) - millis / Expression._durations.get(type));
		this._emotions.set(type, value);
		return value;
	}

	emote(type : EmotionType, value : number) : void {
		if (!this._emotions.has(type)) {
			this._emotions.set(type, 0);
		}

		this._emotions.set(type, Math.max(this._emotions.get(type), value));
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);
		const millis = stepData.millis;

		if (this.value(EmotionType.DEAD) > 0) {
			this._current = EmotionType.DEAD;
			return;
		}

		const mad = this.fade(EmotionType.MAD, millis);
		const sad = this.fade(EmotionType.SAD, millis);

		if (mad === 0 && sad === 0) {
			this._current = EmotionType.NORMAL;
		} else if (mad > sad) {
			this._current = EmotionType.MAD;
		} else {
			this._current = EmotionType.SAD;
		}
	}
}