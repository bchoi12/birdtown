
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
		case ChatType.PRINT:
			messageSpan.style.color = "#6b6b6b";
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
			this.delayedHide();

			if (game.initialized()) {
				SoundFactory.play(SoundType.CHAT);
			}
		}

		if (type === ChatType.CHAT) {
			game.playerState(options.clientId)?.chat(msg);
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
		this._chatElm.classList.add(Html.classNoSelect);
		this.delayedHide();
	}

	override onEnable() : void {
		super.onEnable();

		this._chatElm.classList.remove(Html.classTransparent08);
		this._chatElm.classList.remove(Html.classNoSelect);
		this._chatElm.style.bottom = "2em";
		this._chatElm.style.backgroundColor = "rgba(255, 255, 255, 0.6)";
		this._chatElm.style.height = "40%";

		this.showChat();

		this._messageElm.style.visibility = "visible";
		this._messageInputElm.focus();
		this._messageInputElm.placeholder = "Press " + KeyNames.boxed(settings.chatKeyCode) + " to send";
	}

	override onDisable() : void {
		super.onDisable();

		this._chatElm.classList.add(Html.classTransparent08);
		this._chatElm.classList.add(Html.classNoSelect);
		this._chatElm.style.bottom = "1em";
		this._chatElm.style.backgroundColor = "";
		this._chatElm.style.height = "20%";

		this._messageElm.style.visibility = "hidden";
		this._messageInputElm.blur();

		this._chatElm.scrollTop = this._chatElm.scrollHeight;

		this.delayedHide();
	}

	private showChat() : void {
		this._chatElm.style.visibility = "visible";
		this._chatElm.scrollTop = this._chatElm.scrollHeight;
	}

	private delayedHide(delay? : number) : void {
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
			this.chat(ChatType.PRINT, "Buenos días");
			break;
		case "/evening":
			game.world().setTime(TimeType.EVENING);
			this.chat(ChatType.PRINT, "Buenas tardes");
			break;
		case "/night":
			game.world().setTime(TimeType.NIGHT);
			this.chat(ChatType.PRINT, "Buenas noches");
			break;
		case "/die":
			game.playerState().die();
			break;
		case "/game":
			console.log(game);
			break;
		case "/green":
			game.world().greenScreen();
			game.lakitu().portrait();
			ui.clearAllStatuses();
			break;
		case "/lookup":
			if (pieces.length !== 2) {
				console.error("Usage: %s [EntityId]", pieces[0]);
			} else {
				const [entity, ok] = game.entities().getEntity(Number(pieces[1]));
				if (ok) {
					this.chat(ChatType.PRINT, "Found " + entity.name());
					console.log(entity);
				} else {
					console.log("%s not found", pieces[1]);
				}
			}
			break;
		case "/next":
			game.audio().nextTrack();
			return;
		case "/portrait":
			game.lakitu().portrait();
			ui.clearAllStatuses();
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
				const speed = Number(pieces[1]);
				game.runner().setUpdateSpeed(speed);
				this.chat(ChatType.PRINT, "Set speed to " + speed);
			}
			break;
		case "/stand":
			if (game.lakitu().validTargetEntity() && game.lakitu().targetEntity().hasProfile()) {
				game.lakitu().targetEntity().profile().uprightStop();
			}
			break;
		case "/stats":
			ui.setDebugStats(true);
			this.chat(ChatType.PRINT, "Showing debug stats");
			break;
		case "/nostats":
			ui.setDebugStats(false);
			this.chat(ChatType.PRINT, "Hiding debug stats");
			break;
		case "/tick":
			if (pieces.length !== 2) {
				console.error("Usage: %s [Number]", pieces[0])
			} else {
				const rate = Number(pieces[1]);
				game.runner().setTickRate(rate);
				this.chat(ChatType.PRINT, "Set tick rate to " + rate);
			}
			break;
		default:
			this.chat(ChatType.ERROR, "Unknown command: " + message);
		}
	}
}