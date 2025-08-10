
import { game } from 'game'
import { GameState } from 'game/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { InfoType, UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

import { Optional } from 'util/optional'

export class TimerHandler extends HandlerBase implements Handler {

	private static readonly _infinity = "∞";
	private static readonly _maxMillis = 999 * 1000;

	private _timerElm : HTMLElement;
	private _timerEnabled : boolean;

	constructor() {
		super(HandlerType.TIMER);

		this._timerElm = Html.elm(Html.divTimer);
		this._timerEnabled = false;
	}

	override setVisible(visible : boolean) : void {
		super.setVisible(visible);

		if (visible) {
			this._timerElm.style.display = "block";
		} else {
			this._timerElm.style.display = "none";
		}
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		if (mode !== UiMode.GAME && mode !== UiMode.CHAT) {
			this._timerElm.style.display = "none";
		} else {
			if (this.visible()) {
				this._timerElm.style.display = "block";
			}
		}
	}


	hasTime() : boolean { return this._timerEnabled; }

	setTime(millis : number) : void {
		if (millis <= 0) {
			this.clear();
			return;
		}

		if (millis > TimerHandler._maxMillis) {
			this._timerElm.textContent = TimerHandler._infinity;
		} else {
			this._timerElm.textContent = "" + Math.floor(millis / 1000);
		}

		if (!this._timerEnabled) {
			this._timerElm.style.top = "0";
			this._timerEnabled = true;
		}
		this._timerElm.style.visibility = "visible";
	}

	clear() : void {
		this._timerElm.style.visibility = "hidden";

		if (!this._timerEnabled) {
			return;
		}

		this._timerElm.style.top = "-3em";
		this._timerElm.textContent = TimerHandler._infinity;
		this._timerEnabled = false;
	}
}