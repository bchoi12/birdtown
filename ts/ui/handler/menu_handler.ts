
import { game } from 'game'

import { UiMessage, UiMessageType } from 'message/ui_message'

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
	private _dialogWrapper : DialogWrapper;
	private _voiceWrapper : VoiceWrapper;
	private _menuElm : HTMLElement;
	private _continueElm : HTMLElement;

	private _canMenu : boolean;

	constructor() {
		super(HandlerType.MENU, {
			mode: UiMode.MENU,
		});

		this._modalsElm = Html.elm(Html.divModals);
		this._dialogWrapper = new DialogWrapper();
		this._voiceWrapper = new VoiceWrapper(/*self=*/true);
		this._menuElm = Html.elm(Html.divMenu);
		this._continueElm = Html.elm(Html.menuContinue);

		this._dialogWrapper.titleElm().textContent = "Menu";
		this._dialogWrapper.elm().style.visibility = "hidden";
		this._modalsElm.prepend(this._dialogWrapper.elm());

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

		let fullscreen = new SettingWrapper<FullscreenSetting>({
			name: "Fullscreen Mode",
			get: () => { return settings.fullscreenSetting; },
			click: (current : FullscreenSetting) => {
				if (current === FullscreenSetting.WINDOWED) {
					settings.fullscreenSetting = FullscreenSetting.FULLSCREEN;
				} else {
					settings.fullscreenSetting = FullscreenSetting.WINDOWED;
				}
			},
			text: (current : FullscreenSetting) => {
				return FullscreenSetting[current];
			},
		});
		this._dialogWrapper.contentElm().appendChild(fullscreen.elm());

		let pointer = new SettingWrapper<PointerSetting>({
			name: "In-game Cursor",
			get: () => { return settings.pointerSetting; },
			click: (current : PointerSetting) => {
				settings.pointerSetting = current === PointerSetting.LOCKED ? PointerSetting.NORMAL : PointerSetting.LOCKED;
			},
			text: (current : PointerSetting) => {
				return PointerSetting[current];
			},
		});
		this._dialogWrapper.contentElm().appendChild(pointer.elm());


		this._dialogWrapper.footerElm().appendChild(this._voiceWrapper.elm());

		let shareURL = new ButtonWrapper();
		shareURL.elm().appendChild(Icon.create(IconType.SHARE));
		shareURL.addOnClick(() => {
			navigator.clipboard.writeText(window.location.href + "?r=" + game.netcode().room());

			let msg = new UiMessage(UiMessageType.TOOLTIP);
			msg.setTtl(3000);
			msg.setTooltipType(TooltipType.COPIED_URL);
			ui.handleMessage(msg);
		});
		this._dialogWrapper.footerElm().appendChild(shareURL.elm());

		let miniContinue = new ButtonWrapper();
		miniContinue.elm().style.float = "right";
		miniContinue.setText("[Continue]");
		miniContinue.addOnClick(() => {
			this.disable();
		});
		this._dialogWrapper.footerElm().appendChild(miniContinue.elm());

		let fullMenu = new ButtonWrapper();
		fullMenu.elm().style.float = "right";
		fullMenu.setText("[Full Menu]");
		fullMenu.addOnClick(() => {
			this._dialogWrapper.elm().style.visibility = "hidden";
			this._menuElm.style.visibility = "visible";
		});
		this._dialogWrapper.footerElm().appendChild(fullMenu.elm());

		this._continueElm.onclick = (e : any) => {
			this.disable();
		}
	}

	handleVoiceError() : void { this._voiceWrapper.handleVoiceError(); }

	override onEnable() : void {
		super.onEnable();

		this._dialogWrapper.elm().style.visibility = "visible";
	}

	override onDisable() : void {
		super.onDisable();

		this._dialogWrapper.elm().style.visibility = "hidden";
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