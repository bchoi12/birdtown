
import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

export class MenuHandler extends HandlerBase implements Handler {
	private _menuElm : HTMLElement;
	private _continueElm : HTMLElement;

	private _canPause : boolean;

	constructor() {
		super(HandlerType.PAUSE);

		this._menuElm = Html.elm(Html.divMenu);
		this._continueElm = Html.elm(Html.menuContinue);

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
				ui.setMode(UiMode.SETTINGS);
			} else if (ui.mode() === UiMode.SETTINGS) {
				ui.setMode(UiMode.GAME);
			}
		})

		this._continueElm.onclick = (e : any) => {
			if (ui.mode() !== UiMode.SETTINGS) {
				return;
			}
			ui.setMode(UiMode.GAME);
		}
	}

	override setMode(mode : UiMode) : void {
		if (mode === UiMode.SETTINGS) {
			this._menuElm.style.visibility = "visible";
			this._canPause = false;
		} else {
			this._menuElm.style.visibility = "hidden";
		}
	}
}