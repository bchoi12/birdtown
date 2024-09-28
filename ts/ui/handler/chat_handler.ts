
import { game } from 'game'
import { SoundType } from 'game/factory/api'
import { SoundFactory } from 'game/factory/sound_factory'
import { PlayerRole, TimeType } from 'game/system/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, ChatType, ChatOptions } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { NameWrapper } from 'ui/wrapper/name_wrapper'

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

	chat(type : ChatType, msg : string, options? : ChatOptions) : void {
		if (options) {
			let nameWrapper = new NameWrapper();
			nameWrapper.setClientId(options.clientId);
			nameWrapper.elm().style.marginRight = "0.3em";
			this._chatElm.append(nameWrapper.elm());
		}

		let messageSpan = Html.span();
		if (type === ChatType.CHAT) {
			messageSpan.textContent = msg;
		} else {
			messageSpan.innerHTML = msg;
		}

		messageSpan.style.fontSize = "0.9em";

		switch (type) {
		case ChatType.LOG:
			messageSpan.style.color = "#333";
			break;
		case ChatType.ERROR:
			messageSpan.style.color = "#ff0000";
			messageSpan.style.fontWeight = "bold";
			break;
		}

		this._chatElm.append(messageSpan);
		this._chatElm.append(Html.br());

		if (type !== ChatType.LOG) {
			this.showChat();
			this.hide();

			if (game.initialized()) {
				SoundFactory.play(SoundType.CHAT);
			}
		}
	}

	override setup() : void {
		super.setup();

		this.chat(ChatType.LOG, "Press " + KeyNames.kbd(settings.chatKeyCode) + " to chat");
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		document.addEventListener("keydown", (e : any) => {
			if (e.repeat) return;

			if (e.keyCode === settings.chatKeyCode || this.enabled() && e.keyCode === settings.menuKeyCode) {
				e.preventDefault();

				if (ui.mode() === UiMode.GAME) {
					this.enable();
				} else if (this.enabled()) {
					this.flushMessage();
					this.disable();
				}
			}
		});	

		this.showChat();
		this.hide();
	}

	override onEnable() : void {
		super.onEnable();

		this._chatElm.classList.remove(Html.classTransparent07);
		this._chatElm.classList.remove(Html.classNoSelect);
		this._chatElm.style.bottom = "2em";
		this._chatElm.style.backgroundColor = "rgba(255, 255, 255, 0.6)";

		this.showChat();

		this._messageElm.style.visibility = "visible";
		this._messageInputElm.focus();
		this._messageInputElm.placeholder = "Press " + KeyNames.boxed(settings.chatKeyCode) + " to send";
	}

	override onDisable() : void {
		super.onDisable();

		this._chatElm.classList.add(Html.classTransparent07);
		this._chatElm.classList.add(Html.classNoSelect);
		this._chatElm.style.bottom = "1em";
		this._chatElm.style.backgroundColor = "";

		this._messageElm.style.visibility = "hidden";
		this._messageInputElm.blur();

		this.hide();
	}

	private showChat() : void {
		this._chatElm.style.visibility = "visible";
		this._chatElm.scrollTop = this._chatElm.scrollHeight;
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
				game.netcode().sendChat(game.clientId(), message);
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
		case "/day":
			game.world().setTime(TimeType.DAY);
			break;
		case "/evening":
			game.world().setTime(TimeType.EVENING);
			break;
		case "/night":
			game.world().setTime(TimeType.NIGHT);
			break;
		case "/die":
			game.playerState().die();
			break;
		case "/gamestate":
			console.log(game);
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
		case "/role":
			if (pieces.length !== 2) {
				console.error("Usage: %s [clientId]", pieces[0]);
			} else {
				const clientId = Number(pieces[1]);
				if (game.playerStates().hasPlayerState(clientId)) {
					this.chat(ChatType.PRINT, PlayerRole[game.playerState(clientId).role()])
				} else {
					this.chat(ChatType.PRINT, "Cannot find client " + clientId);
				}
			}
			break;
		case "/speed":
			if (pieces.length !== 2) {
				console.error("Usage: %s [Number]", pieces[0])
			} else {
				game.runner().setUpdateSpeed(Number(pieces[1]));
				this.chat(ChatType.PRINT, "Set speed to " + Number(pieces[1]));
			}
			break;
		case "/stats":
			ui.setDebugStats(true);
			break;
		case "/nostats":
			ui.setDebugStats(false);
			break;
		default:
			console.error("Unknown command:", message);
		}
	}
}