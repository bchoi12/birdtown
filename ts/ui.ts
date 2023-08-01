
import { game } from 'game'
import { Profile } from 'game/component/profile'

import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { CounterType, KeyType, UiMode } from 'ui/api'
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
import { PauseHandler } from 'ui/handler/pause_handler'
import { SettingsHandler } from 'ui/handler/settings_handler'
import { StatsHandler } from 'ui/handler/stats_handler'
import { TooltipHandler } from 'ui/handler/tooltip_handler'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { Vec } from 'util/vector'

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
	private _pauseHandler : PauseHandler;
	private _settingsHandler : SettingsHandler;
	private _statsHandler : StatsHandler;
	private _tooltipHandler : TooltipHandler;

	constructor() {
		this._mode = UiMode.DEFAULT;
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
		this._pauseHandler = this.add<PauseHandler>(new PauseHandler());
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

	add<T extends Handler>(handler : T) {
		this._handlers.set(handler.type(), handler);
		return handler;
	}
	get<T extends Handler>(type : HandlerType) : T { return <T>this._handlers.get(type); }
	mode() : UiMode { return this._mode; }
	setMode(mode : UiMode) {
		this._mode = mode;
		this._handlers.forEach((handler) => {
			handler.setMode(mode);
		});	
	}
	updatePos(clientId : number, pos : Vec) : void {
		let context = this.audioContext();
		if (clientId === game.clientId()) {
			let listener = context.listener;
			listener.positionX.setValueAtTime(pos.x, context.currentTime);
			listener.positionY.setValueAtTime(pos.y, context.currentTime);

			if (defined(pos.z)) {
				listener.positionZ.setValueAtTime(pos.z, context.currentTime);
			}
			return;
		}

		if (this._clientsHandler.hasClient(clientId)) {
			this._clientsHandler.getClient(clientId).updatePos(pos);
		}
	}

	chat(msg : string) : void { this._chatHandler.chat(msg); }

	keys() : Set<KeyType> { return this._inputHandler.keys(); }
	mouse() : Vec { return this._inputHandler.mouse(); }
	resetKeyBinds() : void { this._inputHandler.reset(); }

	handleMessage(msg : UiMessage) : void {
		this._handlers.forEach((handler) => {
			handler.handleMessage(msg);
		});
	}

	addStream(clientId : number, stream : MediaStream) : void { this._clientsHandler.addStream(clientId, stream); }
	removeStream(clientId : number) : void { this._clientsHandler.removeStream(clientId); }
	removeStreams() : void { this._clientsHandler.removeStreams(); }
}

export const ui = new UI();