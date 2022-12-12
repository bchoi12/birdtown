
import { options } from 'options'

import { ui, HandlerType, Mode } from 'ui'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

export class Pause extends HandlerBase implements Handler {
	private _pauseElm : HTMLElement;
	private _continueElm : HTMLElement;

	private _canPause : boolean;

	constructor() {
		super(HandlerType.PAUSE);

		this._pauseElm = Html.elm(Html.divPause);
		this._continueElm = Html.elm(Html.pauseContinue);

		this._canPause = true;
	}

	setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== options.pauseKeyCode) return;

			this._canPause = true;
		});

		document.addEventListener("keydown", (e : any) => {
			if (!this._canPause || e.keyCode !== options.pauseKeyCode) return;

			if (ui.mode() === Mode.CHAT) {
				ui.setMode(Mode.GAME);
			} else if (ui.mode() === Mode.GAME) {
				ui.setMode(Mode.PAUSE);
			} else if (ui.mode() === Mode.PAUSE) {
				ui.setMode(Mode.GAME);
			}
		})

		this._continueElm.onclick = (e : any) => {
			if (ui.mode() !== Mode.PAUSE) {
				return;
			}
			ui.setMode(Mode.GAME);
		}
	}

	reset() : void {}

	setMode(mode : Mode) : void {
		if (mode === Mode.PAUSE) {
			this._pauseElm.style.display = "block";
			this._canPause = false;
		} else {
			this._pauseElm.style.display = "none";
		}
	}
}