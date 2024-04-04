
import { game } from 'game'
import { CounterType } from 'game/component/api'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { KeyType, UiMode } from 'ui/api'
import { Handler } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

import { AnnouncementHandler } from 'ui/handler/announcement_handler'
import { ChatHandler } from 'ui/handler/chat_handler'
import { ClientsHandler } from 'ui/handler/clients_handler'
import { CountersHandler } from 'ui/handler/counters_handler'
import { DialogHandler } from 'ui/handler/dialog_handler'
import { InputHandler } from 'ui/handler/input_handler'
import { KeyBindHandler } from 'ui/handler/key_bind_handler'
import { LoginHandler } from 'ui/handler/login_handler'
import { MenuHandler } from 'ui/handler/menu_handler'
import { ScoreboardHandler } from 'ui/handler/scoreboard_handler'
import { SettingsHandler } from 'ui/handler/settings_handler'
import { StatsHandler } from 'ui/handler/stats_handler'
import { TooltipHandler } from 'ui/handler/tooltip_handler'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

class UI {

	private _mode : UiMode;
	private _audioContext : Optional<AudioContext>;

	private _handlers : Map<HandlerType, Handler>;

	private _announcementHandler : AnnouncementHandler;
	private _chatHandler : ChatHandler;
	private _clientsHandler : ClientsHandler;
	private _countersHandler : CountersHandler;
	private _dialogHandler : DialogHandler;
	private _inputHandler : InputHandler;
	private _keyBindHandler : KeyBindHandler;
	private _loginHandler : LoginHandler;
	private _menuHandler : MenuHandler;
	private _scoreboardHandler : ScoreboardHandler;
	private _settingsHandler : SettingsHandler;
	private _statsHandler : StatsHandler;
	private _tooltipHandler : TooltipHandler;

	constructor() {
		this._mode = UiMode.UNKNOWN;
		this._audioContext = new Optional();

		this._handlers = new Map();		

		this._announcementHandler = this.add(new AnnouncementHandler());
		this._chatHandler = this.add(new ChatHandler());
		this._clientsHandler = this.add(new ClientsHandler());
		this._countersHandler = this.add(new CountersHandler());
		this._dialogHandler = this.add(new DialogHandler());
		this._inputHandler = this.add(new InputHandler());
		this._keyBindHandler = this.add<KeyBindHandler>(new KeyBindHandler());
		this._loginHandler = this.add<LoginHandler>(new LoginHandler());
		this._menuHandler = this.add<MenuHandler>(new MenuHandler());
		this._scoreboardHandler = this.add<ScoreboardHandler>(new ScoreboardHandler());
		this._settingsHandler = this.add<SettingsHandler>(new SettingsHandler());
		this._statsHandler = this.add<StatsHandler>(new StatsHandler());
		this._tooltipHandler = this.add<TooltipHandler>(new TooltipHandler());
	}

	setup() : void {
		this._handlers.forEach((handler) => {
			handler.setup();
		});
	}

	audioContext() : AudioContext {
		// Lazy initialize since I think browser needs user input beforehand
		if (!this._audioContext.has()) {
			this._audioContext.set(new AudioContext());
		}
		return this._audioContext.get();
	}
	inputWidth() : number { return this._inputHandler.inputWidth(); }
	inputHeight() : number { return this._inputHandler.inputHeight(); }
	screenRect() : DOMRect { return this._inputHandler.screenRect(); }

	handleMessage(msg : UiMessage) : void {
		if (!msg.valid()) {
			console.error("Error: invalid message", msg);
			return;
		}

		this._handlers.forEach((handler) => {
			handler.handleMessage(msg);
		});
	}

	add<T extends Handler>(handler : T) {
		this._handlers.set(handler.type(), handler);
		return handler;
	}
	mode() : UiMode { return this._mode; }
	setMode(mode : UiMode) : void {
		if (this._mode === mode) {
			return;
		}

		this._handlers.forEach((handler) => {
			handler.onModeChange(mode, this._mode);
		});	
		this._mode = mode;
	}
	updatePos(clientId : number, pos : Vec) : void {
		let context = this.audioContext();
		if (clientId === game.clientId()) {
			let listener = context.listener;
			if (listener.positionX) {
				listener.positionX.setValueAtTime(pos.x, context.currentTime);
				listener.positionY.setValueAtTime(pos.y, context.currentTime);
				listener.positionZ.setValueAtTime(pos.z ? pos.z : 0, context.currentTime);
			} else {
				// Support Firefox
				listener.setPosition(pos.x, pos.y, pos.z ? pos.z : 0);
			}
			return;
		}

		if (this._clientsHandler.hasClient(clientId)) {
			this._clientsHandler.getClient(clientId).updatePos(pos);
		}
	}
	updateCounters(counters : Map<CounterType, number>) : void { this._countersHandler.updateCounters(counters); }

	chat(msg : string) : void { this._chatHandler.chat(msg); }
	clear() : void {
		this._handlers.forEach((handler) => {
			handler.clear();
		});	
	}

	keys() : Set<KeyType> { return this._inputHandler.keys(); }
	clearKeys() : void { this._inputHandler.clearKeys(); }
	mouse() : Vec2 { return this._inputHandler.mouse(); }
	resetKeyBinds() : void { this._inputHandler.reset(); }

	addStream(clientId : number, stream : MediaStream) : void { this._clientsHandler.addStream(clientId, stream); }
	removeStream(clientId : number) : void { this._clientsHandler.removeStream(clientId); }
	removeStreams() : void { this._clientsHandler.removeStreams(); }
}

export const ui = new UI();