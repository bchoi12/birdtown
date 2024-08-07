
import { game } from 'game'

import { settings } from 'settings'
import {
	FullscreenSetting,
	PointerSetting,
} from 'settings/api'

import { ui } from 'ui'
import { UiMode, TooltipType } from 'ui/api'
import { Icon, IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { SettingWrapper } from 'ui/wrapper/setting_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { VoiceWrapper } from 'ui/wrapper/voice_wrapper'

export class MenuHandler extends HandlerBase implements Handler {

	private _modalsElm : HTMLElement;
	private _menuElm : HTMLElement;
	private _continueElm : HTMLElement;

	private _canMenu : boolean;

	constructor() {
		super(HandlerType.MENU, {
			mode: UiMode.MENU,
		});

		this._modalsElm = Html.elm(Html.divModals);
		this._menuElm = Html.elm(Html.divMenu);
		this._continueElm = Html.elm(Html.menuContinue);

		this._canMenu = true;
	}

	override setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== settings.menuKeyCode) return;

			this._canMenu = true;
		});

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode !== settings.menuKeyCode || !this._canMenu) return;

			if (ui.mode() === UiMode.GAME) {
				this.enable();
				this._canMenu = false;
				e.preventDefault();
			}
		});

		document.addEventListener("fullscreenchange", (e: any) => {
			if (ui.mode() !== UiMode.GAME) { return; }
			if (settings.fullscreen() && !ui.isFullscreen()) {
				this.enable();
			}
		});
		document.addEventListener("pointerlockchange", (e : any) => {
			if (ui.mode() !== UiMode.GAME) { return; }
			if (settings.pointerLocked() && !ui.isPointerLocked()) {
				this.enable();
			}
		});

		this._continueElm.onclick = (e : any) => {
			this.disable();
		}
	}

	override onEnable() : void {
		super.onEnable();

		this._menuElm.style.visibility = "visible";
	}

	override onDisable() : void {
		super.onDisable();

		this._menuElm.style.visibility = "hidden";
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		if (mode === UiMode.GAME) {
			if (settings.pointerLocked()) {
				ui.requestPointerLock();
			}
			if (settings.fullscreen()) {
				ui.requestFullscreen();
			}
		} else {
			ui.exitPointerLock();
			ui.exitFullscreen();
		}
	}
}