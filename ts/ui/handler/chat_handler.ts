
import { game } from 'game'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'

export class ChatHandler extends HandlerBase implements Handler {

	private _chatElm : HTMLElement;
	private _messageElm : HTMLElement;
	private _messageInputElm : HTMLInputElement;

	constructor() {
		super(HandlerType.CHAT);

		this._chatElm = Html.elm(Html.divChat);
		this._messageElm = Html.elm(Html.divMessage);
		this._messageInputElm = Html.inputElm(Html.inputMessage);
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

		document.addEventListener("keydown", (e : any) => {
			if (e.repeat) return;

			if (e.keyCode === settings.chatKeyCode) {
				e.preventDefault();
				this.chatKeyPressed();
			}
		});		
	}

	setMode(mode : UiMode) : void {
		if (mode === UiMode.CHAT) {
			this._chatElm.style.visibility = "visible";
			this._chatElm.classList.remove(Html.classSlightlyTransparent);
			this._chatElm.classList.remove(Html.classNoSelect);
			this._messageElm.style.visibility = "visible";
			this._chatElm.style.bottom = "2em";
			this._chatElm.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
			this._messageInputElm.focus();
		} else {
			this._chatElm.classList.add(Html.classSlightlyTransparent);
			this._chatElm.classList.add(Html.classNoSelect);
			this._messageElm.style.visibility = "hidden";
			this._chatElm.style.bottom = "1em";
			this._chatElm.style.backgroundColor = "";
			this._messageInputElm.blur();
		}
	}

	private chatKeyPressed() : void {
		if (ui.mode() === UiMode.GAME) {
			ui.setMode(UiMode.CHAT);
			return;
		}

		if (ui.mode() !== UiMode.CHAT) {
			return;
		}

		const message = Html.trimmedValue(this._messageInputElm);
		if (message.length == 0) {
			ui.setMode(UiMode.GAME);
			return;
		}
		this._messageInputElm.value = "";

		if (message.startsWith("/")) {
			this.command(message);
		} else {
			game.netcode().sendChat(message);
		}

		ui.setMode(UiMode.GAME);
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
		default:
			console.error("Unknown command:", message);
		}
	}
}