
import { ui } from 'ui'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

export class FocusHandler extends HandlerBase implements Handler {

	private _focused : boolean;
	private _lastChangeTime : number;

	constructor() {
		super(HandlerType.FOCUS);

		this._focused = true;
		this._lastChangeTime = Date.now();
	}

	override setup() : void {
		document.addEventListener("visibilitychange", (event) => {
			if (!this._focused && document.visibilityState == "visible") {
				this._focused = true;
				this._lastChangeTime = Date.now();
			} else if (this._focused) {
				this._focused = false;
				this._lastChangeTime = Date.now();
			}
		});
	}

	focused() : boolean { return this._focused; }
	lastChangeTime() : number { return this._lastChangeTime; }
}