
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { StepData } from 'game/game_object'

import { FnGlobals, InterpType } from 'global/fn_globals'

import { Optional } from 'util/optional'
import { Timer } from 'util/timer'

interface EmotionOptions {
	fn : InterpType;
}

interface Emotion extends EmotionOptions {
	value : number;
	timer : Timer;
}

type EmoteParams = {
	max : number;
	delta? : number;
	millis : number;
}

type ExpressionInitOptions<T> = {
	defaultValue: T;
}

export class Expression<T extends number> extends ComponentBase implements Component {

	private static readonly _defaultOptions = { fn: InterpType.LINEAR }

	private _current : T;
	private _default : T;
	private _override : Optional<T>;
	private _emotions : Map<T, Emotion>;

	constructor(options : ExpressionInitOptions<T>) {
		super(ComponentType.EXPRESSION);

		this._current = options.defaultValue;
		this._default = options.defaultValue;
		this._override = new Optional();
		this._emotions = new Map();

		/*
		this.addProp<T>({
			export: () => { return this.emotion(); },
			import: (obj : T) => { this.setOverride(obj); },
		});
		*/
	}

	override reset() : void {
		super.reset();

		this._emotions.forEach((emotion : Emotion) => {
			emotion.timer.reset();
		});
		this._current = this._default;
		this._override.clear();
	}

	emotion() : T { return this._override.has() ? this._override.get() : this._current; }

	setOverride(type : T) : void { this._override.set(type); }
	clearOverride() : void { this._override.clear(); }

	registerEmotion(type : T, options? : EmotionOptions) : void {
		if (!this.isSource()) { return; }

		if (this._emotions.has(type)) {
			console.error("Error: skipping registering already existing emotion", type, options);
			return;
		}

		this._emotions.set(type, {
			...(options ? options : Expression._defaultOptions),
			value: 0,
			timer: this.newTimer({
				canInterrupt: true,
			}),
		})
	}

	emote(type : T, params : EmoteParams) : void {
		if (!this.isSource()) { return; }

		if (!this._emotions.has(type)) {
			this.registerEmotion(type);
		}

		let emotion = this._emotions.get(type);
		if (params.delta) {
			emotion.value += params.delta;
		}
		emotion.value = Math.min(params.max, emotion.value);
		emotion.timer.start(params.millis);

		this.updateEmotion();
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);

		this.updateEmotion();
	}

	private updateEmotion() : void {
		if (!this.isSource()) { return; }

		let max = 0;
		this._current = this._default;
		this._emotions.forEach((emotion : Emotion, type : T) => {
			if (!emotion.timer.hasTimeLeft()) {
				return;
			}

			const value = emotion.value * FnGlobals.interpFns.get(emotion.fn)(1 - emotion.timer.percentElapsed());
			if (value > max) {
				this._current = type;
				max = value;
			}
		});
	}

}