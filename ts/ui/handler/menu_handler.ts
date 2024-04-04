
import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

export class MenuHandler extends HandlerBase implements Handler {
	private _miniMenuElm : HTMLElement;
	private _menuElm : HTMLElement;
	private _continueElm : HTMLElement;

	private _canMenu : boolean;

	constructor() {
		super(HandlerType.MENU, {
			mode: UiMode.MENU,
		});

		this._menuElm = Html.elm(Html.divMenu);
		this._continueElm = Html.elm(Html.menuContinue);

		this._canMenu = true;
	}

	override setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== settings.menuKeyCode) return;

			e.preventDefault();
			this._canMenu = true;
		});

		document.addEventListener("keydown", (e : any) => {
			if (!this._canMenu || e.keyCode !== settings.menuKeyCode) return;

			e.preventDefault();

			if (ui.mode() === UiMode.GAME) {
				this.enable();
			} else if (this.enabled()) {
				this.disable();
			}
		});

		this._continueElm.onclick = (e : any) => {
			if (ui.mode() !== UiMode.MENU) {
				return;
			}
			this.disable();
		}
	}

	override onEnable() : void {
		super.onEnable();

		this._menuElm.style.visibility = "visible";
		this._canMenu = false;
	}

	override onDisable() : void {
		this._menuElm.style.visibility = "hidden";
	}
}