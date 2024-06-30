
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

import { Optional } from 'util/optional'

export class ChatHandler extends HandlerBase implements Handler {

	private static readonly _hideDelay = 8000;

	private _chatElm : HTMLElement;
	private _messageElm : HTMLElement;
	private _messageInputElm : HTMLInputElement;
	private _hideTimeout : Optional<number>;

	constructor() {
		super(HandlerType.CHAT, {
			mode: UiMode.CHAT,
		});

		this._chatElm = Html.elm(Html.divChat);
		this._messageElm = Html.elm(Html.divMessage);
		this._messageInputElm = Html.inputElm(Html.inputMessage);

		this._hideTimeout = new Optional();
	}

	chat(msg : string) : void {
		const messageSpan = Html.span();
		messageSpan.textContent = msg;

		this._chatElm.append(messageSpan);
		this._chatElm.append(Html.br());
		this._chatElm.scrollTop = this._chatElm.scrollHeight;
	}

	override setup() : void {
		this._messageInputElm.style.width = this._chatElm.offsetWidth + "px";

		this.chat("Press " + KeyNames.boxedLower(settings.chatKeyCode) + " to chat");

		document.addEventListener("keydown", (e : any) => {
			if (e.repeat) return;

			if (e.keyCode === settings.chatKeyCode) {
				e.preventDefault();

				if (ui.mode() === UiMode.GAME) {
					this.enable();
				} else if (this.enabled()) {
					this.flushMessage();
					this.disable();
				}
			}
		});		
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		if (mode === UiMode.GAME) {
			this._chatElm.style.visibility = "visible";
			this.hide();
		}
	}

	override onEnable() : void {
		super.onEnable();

		this._chatElm.style.visibility = "visible";

		this._chatElm.classList.remove(Html.classTransparent05);
		this._chatElm.classList.remove(Html.classNoSelect);
		this._chatElm.style.bottom = "2em";
		this._chatElm.style.backgroundColor = "rgba(255, 255, 255, 0.6)";

		this._messageElm.style.visibility = "visible";
		this._messageInputElm.focus();
		this._messageInputElm.placeholder = "Press " + KeyNames.boxedLower(settings.chatKeyCode) + " to send";
	}

	override onDisable() : void {
		super.onDisable();

		this._chatElm.classList.add(Html.classTransparent05);
		this._chatElm.classList.add(Html.classNoSelect);
		this._chatElm.style.bottom = "1em";
		this._chatElm.style.backgroundColor = "";

		this._messageElm.style.visibility = "hidden";
		this._messageInputElm.blur();

		this.hide();
	}

	private hide(delay? : number) : void {
		if (!delay) {
			delay = ChatHandler._hideDelay;
		}

		if (this._hideTimeout.has()) {
			window.clearTimeout(this._hideTimeout.get());
		}

		this._hideTimeout.set(window.setTimeout(() => {
			this._chatElm.style.visibility = "hidden";
		}, delay));
	}

	private flushMessage() : void {
		const message = Html.trimmedValue(this._messageInputElm);
		this._messageInputElm.value = "";
		if (message.length > 0) {
			if (message.startsWith("/")) {
				this.command(message);
			} else {
				game.netcode().sendChat(message);
			}
		}
	}

	private command(message : string) {
		const pieces = message.trim().split(" ");
		if (pieces.length === 0) {
			return;
		}

		switch (pieces[0].toLowerCase()) {
		case "/test":
			console.log("test");
			break;
		case "/die":
			game.playerState().die();
			break;
		case "/lookup":
			if (pieces.length !== 2) {
				console.error("Usage: %s [EntityId]", pieces[0]);
			} else {
				const [entity, ok] = game.entities().getEntity(Number(pieces[1]));
				if (ok) {
					console.log(entity);
				} else {
					console.log("%s not found", pieces[1]);
				}
			}
			break;
		case "/speed":
			if (pieces.length !== 2) {
				console.error("Usage: %s [Number]", pieces[0])
			} else {
				game.runner().setUpdateMultiplier(Number(pieces[1]));
			}
			break;
		default:
			console.error("Unknown command:", message);
		}
	}
}