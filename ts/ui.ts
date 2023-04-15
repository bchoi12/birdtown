
import { HandlerType, Key, UiMode, NewClientMsg } from 'ui/api'

import { Handler } from 'ui/handler'
import { ClientsHandler } from 'ui/handler/clients_handler'
import { ChatHandler } from 'ui/handler/chat_handler'
import { DialogHandler } from 'ui/handler/dialog_handler'
import { InputHandler } from 'ui/handler/input_handler'
import { KeyBindHandler } from 'ui/handler/key_bind_handler'
import { LoginHandler } from 'ui/handler/login_handler'
import { PauseHandler } from 'ui/handler/pause_handler'
import { SettingsHandler } from 'ui/handler/settings_handler'
import { StatsHandler } from 'ui/handler/stats_handler'

import { Vec } from 'util/vector'

class UI {

	private _mode : UiMode;

	private _handlers : Map<HandlerType, Handler>;

	private _chatHandler : ChatHandler;
	private _clientsHandler : ClientsHandler;
	private _dialogHandler : DialogHandler;
	private _inputHandler : InputHandler;
	private _keyBindHandler : KeyBindHandler;
	private _loginHandler : LoginHandler;
	private _pauseHandler : PauseHandler;
	private _settingsHandler : SettingsHandler;
	private _statsHandler : StatsHandler;

	constructor() {
		this._mode = UiMode.DEFAULT;

		this._handlers = new Map();		

		this._chatHandler = this.add<ChatHandler>(new ChatHandler());
		this._clientsHandler = this.add<ClientsHandler>(new ClientsHandler());
		this._dialogHandler = this.add<DialogHandler>(new DialogHandler());
		this._inputHandler = this.add<InputHandler>(new InputHandler());
		this._keyBindHandler = this.add<KeyBindHandler>(new KeyBindHandler());
		this._loginHandler = this.add<LoginHandler>(new LoginHandler());
		this._pauseHandler = this.add<PauseHandler>(new PauseHandler());
		this._settingsHandler = this.add<SettingsHandler>(new SettingsHandler());
		this._statsHandler = this.add<StatsHandler>(new StatsHandler());
	}

	setup() : void {
		this._handlers.forEach((handler) => {
			handler.setup();
		});
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

	chat(msg : string) : void { this._chatHandler.chat(msg); }

	keys() : Set<Key> { return this._inputHandler.keys(); }
	mouse() : Vec { return this._inputHandler.mouse(); }
	resetKeyBinds() : void { this._inputHandler.reset(); }

	onNewClient(msg : NewClientMsg) : void {
		this._clientsHandler.onNewClient(msg);
	}
	pushDialog(onSubmit : () => void) : number {
		return this._dialogHandler.pushDialog({
			titleHtml: "TITLE",
			textHtml: "click when ready",
			onSubmit: [onSubmit],
		});
	}

	addStream(gameId : number, stream : MediaStream) : void { this._clientsHandler.addStream(gameId, stream); }
	removeStream(gameId : number) : void { this._clientsHandler.removeStream(gameId); }
	removeStreams() : void { this._clientsHandler.removeStreams(); }
}

export const ui = new UI();