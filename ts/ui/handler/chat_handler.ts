
import { options } from 'options'

import { ui, HandlerType, Mode } from 'ui'
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

	setup() : void {
		this._messageInputElm.style.width = this._chatElm.offsetWidth + "px";

		document.addEventListener("keydown", (e : any) => {
			if (e.repeat) return;

			if (e.keyCode === options.chatKeyCode) {
				this.chatKeyPressed();
			}
		});		
	}

	reset() : void {}

	setMode(mode : Mode) {
		if (mode === Mode.CHAT) {
			this._chatElm.style.display = "block";
			this._chatElm.classList.remove(Html.classSlightlyTransparent);
			this._chatElm.classList.remove(Html.classNoSelect);
			this._messageElm.style.display = "block";
			this._chatElm.style.bottom = "2em";
			this._chatElm.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
			this._messageInputElm.focus();
		} else {
			this._chatElm.classList.add(Html.classSlightlyTransparent);
			this._chatElm.classList.add(Html.classNoSelect);
			this._messageElm.style.display = "none";
			this._chatElm.style.bottom = "1em";
			this._chatElm.style.backgroundColor = "";
			this._messageInputElm.blur();
		}
	}

	private chatKeyPressed() : void {
		if (ui.mode() === Mode.GAME) {
			ui.setMode(Mode.CHAT);
			return;
		}

		if (ui.mode() !== Mode.CHAT) {
			return;
		}

		const message = Html.trimmedValue(this._messageInputElm);
		if (message.length == 0) {
			ui.setMode(Mode.GAME);
			return;
		}
		this._messageInputElm.value = "";

		if (message.startsWith("/")) {
			this.command(message);
		} else {
			const messageSpan = Html.span();
			messageSpan.textContent = message;

			this._chatElm.append(messageSpan);
			this._chatElm.append(Html.br());
			this._chatElm.scrollTop = this._chatElm.scrollHeight;
		}

		ui.setMode(Mode.GAME);
	}

	private command(message : string) {
		const pieces = message.trim().split(" ");
		if (pieces.length === 0) {
			return;
		}

		switch (pieces[0].toLowerCase()) {
		case "/test":
			console.log("test");
		default:
			console.error("Unknown command:", message);
		}
	}
}