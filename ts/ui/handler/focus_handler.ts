
import { game } from 'game'

import { ui } from 'ui'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

type OnFocusFn = () => void;

export class FocusHandler extends HandlerBase implements Handler {

	private _fns : Array<OnFocusFn>;
	private _focused : boolean;
	private _lastChangeTime : number;

	constructor() {
		super(HandlerType.FOCUS);

		this._fns = new Array();
		this._focused = true;
		this._lastChangeTime = Date.now();
	}

	override setup() : void {
		document.addEventListener("visibilitychange", (event) => {
			if (!this._focused && document.visibilityState === "visible") {
				this._focused = true;
				this._lastChangeTime = Date.now();

				if (game.initialized()) {
					game.runner().resume();
				}
			} else if (this._focused && document.visibilityState !== "visible") {
				this._focused = false;
				this._lastChangeTime = Date.now();

				if (game.initialized()) {
					game.runner().pause();
				}

				this._fns.forEach((fn : OnFocusFn) => {
					fn();
				});
				this._fns.length = 0;
			}
		});
	}

	focused() : boolean { return this._focused; }
	onFocus(fn : () => void) : void {
		if (this.focused()) {
			fn();
			return;
		}

		this._fns.push(fn);
	}
	lastChangeTime() : number { return this._lastChangeTime; }
}