

import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

export class PauseHandler extends HandlerBase implements Handler {
	private _pauseElm : HTMLElement;
	private _continueElm : HTMLElement;

	private _canPause : boolean;

	constructor() {
		super(HandlerType.PAUSE);

		this._pauseElm = Html.elm(Html.divPause);
		this._continueElm = Html.elm(Html.pauseContinue);

		this._canPause = true;
	}

	override setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== settings.pauseKeyCode) return;

			e.preventDefault();
			this._canPause = true;
		});

		document.addEventListener("keydown", (e : any) => {
			if (!this._canPause || e.keyCode !== settings.pauseKeyCode) return;

			e.preventDefault();

			if (ui.mode() === UiMode.CHAT) {
				ui.setMode(UiMode.GAME);
			} else if (ui.mode() === UiMode.GAME) {
				ui.setMode(UiMode.PAUSE);
			} else if (ui.mode() === UiMode.PAUSE) {
				ui.setMode(UiMode.GAME);
			}
		})

		this._continueElm.onclick = (e : any) => {
			if (ui.mode() !== UiMode.PAUSE) {
				return;
			}
			ui.setMode(UiMode.GAME);
		}
	}

	override setMode(mode : UiMode) : void {
		if (mode === UiMode.PAUSE) {
			this._pauseElm.style.visibility = "visible";
			this._canPause = false;
		} else {
			this._pauseElm.style.visibility = "hidden";
		}
	}
}