
import { game } from 'game'
import { GameState } from 'game/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { settings } from 'settings'
import {
	FullscreenSetting,
	PointerSetting,
} from 'settings/api'

import { ui } from 'ui'
import { UiMode, DialogType, KeyType, StatusType, TooltipType } from 'ui/api'
import { Icon, IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { VoiceWrapper } from 'ui/wrapper/button/voice_wrapper'

export class MenuHandler extends HandlerBase implements Handler {

	private static readonly _allowedStates = new Set([
		GameState.FREE,
		GameState.SETUP,
		GameState.GAME,
	]);

	private _modalsElm : HTMLElement;
	private _menuElm : HTMLElement;
	private _continueElm : HTMLElement;
	private _quitElm : HTMLElement;

	private _menuKeyPressed : boolean;
	private _canMenu : boolean;

	constructor() {
		super(HandlerType.MENU, {
			mode: UiMode.MENU,
		});

		this._modalsElm = Html.elm(Html.divModals);
		this._menuElm = Html.elm(Html.divMenu);
		this._continueElm = Html.elm(Html.menuContinue);
		this._quitElm = Html.elm(Html.menuQuit);

		this._menuKeyPressed = false;
		this._canMenu = true;
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode === settings.keyCode(KeyType.MENU)) {
				this._menuKeyPressed = false;
				this._canMenu = true;
			}
		});

		document.addEventListener("keydown", (e : any) => {
			if (!MenuHandler._allowedStates.has(game.controller().gameState())) {
				return;
			}

			if (e.keyCode === settings.keyCode(KeyType.MENU)) {
				this._menuKeyPressed = true;

				if (this._canMenu && ui.mode() === UiMode.GAME) {
					this.enable();
					this._canMenu = false;

					if (ui.currentStatuses().has(StatusType.DEGRADED)) {
						ui.disableStatus(StatusType.DEGRADED);
						ui.suggestLowSpec();
					}
				}
			}
		});

		this._continueElm.onclick = (e : any) => {
			this.disable();
		}

		this._quitElm.onclick = (e : any) => {
			this.disable();
			if (game.isHost() && game.controller().gameState() !== GameState.FREE) {
				ui.pushDialog(DialogType.RETURN_TO_LOBBY);
			} else {
				ui.pushDialog(DialogType.QUIT);
			}
		}
	}

	override onEnable() : void {
		super.onEnable();

		if (game.isHost()) {
			if (game.controller().gameState() === GameState.FREE) {
				this._quitElm.textContent = "Leave Game";
			} else {
				this._quitElm.textContent = "Return to Lobby";
			}
		}

		this._menuElm.style.display = "block";
	}

	override onDisable() : void {
		super.onDisable();

		settings.save();
		ui.applySettings();
		this._menuElm.style.display = "none";
	}
}