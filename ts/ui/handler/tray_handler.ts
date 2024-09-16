
import { game } from 'game'
import { GameState } from 'game/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { DialogType, TooltipType, UiMode } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { KeyNames } from 'ui/common/key_names'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ShareWrapper } from 'ui/wrapper/button/share_wrapper'
import { VoiceWrapper } from 'ui/wrapper/button/voice_wrapper'

import { Optional } from 'util/optional'

export class TrayHandler extends HandlerBase implements Handler {

	private static readonly _initialTTL = 1;
	private static readonly _ttl = 2000;

	private _trayElm : HTMLElement;

	private _descriptionElm : HTMLElement;
	private _buttonsElm : HTMLElement;
	private _lobbyButton : ButtonWrapper;
	private _voiceWrapper : VoiceWrapper;
	private _toggleElm : HTMLElement;
	private _showButtons : boolean;
	private _hideId : Optional<number>;
	private _hasMouse : boolean;

	constructor() {
		super(HandlerType.TRAY);

		this._trayElm = Html.elm(Html.divTray);

		this._descriptionElm = Html.span();
		this._buttonsElm = Html.span();
		this._lobbyButton = new ButtonWrapper();
		this._voiceWrapper = new VoiceWrapper();
		this._toggleElm = Html.span();
		this._showButtons = true;
		this._hideId = new Optional();
		this._hasMouse = false;

		this._trayElm.appendChild(this._descriptionElm);
		this._trayElm.appendChild(this._buttonsElm);
		this._trayElm.appendChild(this._toggleElm);
	}

	override setup() : void {
		super.setup();

		this._descriptionElm.style.fontSize = "0.8em";
		this._descriptionElm.style.padding = "0.2em 0.2em 0.2em 0.5em";		

		this._trayElm.onmouseenter = (e) => {
			e.preventDefault();

			this._hasMouse = true;
		}

		this._trayElm.onmouseleave = (e) => {
			e.preventDefault();

			this.hide(TrayHandler._ttl);
		};
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		if (game.isHost()) {
			this._lobbyButton = new ButtonWrapper();
			this._lobbyButton.setIcon(IconType.CANCEL);		
			this._lobbyButton.addOnMouseEnter(() => {
				this.showDescription("End the game and return to the lobby");
			});
			this._lobbyButton.addOnClick(() => {
				ui.pushDialog(DialogType.RETURN_TO_LOBBY);
			});
			if (game.controller().gameState() === GameState.FREE) {
				this._lobbyButton.elm().style.display = "none";
			}

			this._buttonsElm.appendChild(this._lobbyButton.elm());
		}

		let menu = new ButtonWrapper();
		menu.setIcon(IconType.MENU_OPEN);
		menu.addOnMouseEnter(() => {
			this.showDescription("Open the menu");
		});
		menu.addOnClick(() => {
			ui.openMenu();
		});
		this._buttonsElm.appendChild(menu.elm())

		let share = new ShareWrapper();
		share.addOnMouseEnter(() => {
			this.showDescription("Copy invite link to clipboard");
		});
		this._buttonsElm.appendChild(share.elm())
		
		this._voiceWrapper.addOnMouseEnter(() => {
			this.showDescription("Toggle proximity voice chat");
		});
		this._buttonsElm.appendChild(this._voiceWrapper.elm());

		let toggle = new ButtonWrapper();
		toggle.setIcon(IconType.MENU_OPEN);
		toggle.setText("Commands");
		toggle.addOnMouseEnter(() => {
			this.show();
		});
		this._toggleElm.appendChild(toggle.elm());

		document.addEventListener("pointerlockchange", (e : any) => {
			if (ui.pointerLocked()) {
				toggle.setTextHTML(KeyNames.kbd(settings.pointerLockKeyCode));
			} else {
				toggle.setText("Commands");
			}
		});

		this._trayElm.style.visibility = "visible";
		this.hide(TrayHandler._initialTTL);
	}

	hasMouse() : boolean { return this._hasMouse; }
	handleVoiceError() : void { this._voiceWrapper.handleVoiceError(); }

	private show() : void {
		this._descriptionElm.style.display = "initial";
		this._buttonsElm.style.display = "initial";

		if (game.controller().gameState() === GameState.FREE) {
			this._lobbyButton.elm().style.display = "none";
		} else {
			this._lobbyButton.elm().style.display = "inline-block";
		}

		if (this._hideId.has()) {
			window.clearTimeout(this._hideId.get());
			this._hideId.clear();
		}
	}

	private showDescription(text : string) : void {
		this._descriptionElm.textContent = "[" + text + "]";
		this.show();
	}

	private hide(ttl : number) : void {
		this._hasMouse = false;
		this._descriptionElm.textContent = "";

		this._hideId.set(window.setTimeout(() => {
			this._descriptionElm.style.display = "none";
			this._buttonsElm.style.display = "none";
		}, ttl));
	}
}