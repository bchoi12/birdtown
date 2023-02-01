
import { Handler } from 'ui/handler'
import { ChatHandler } from 'ui/handler/chat_handler'
import { InputHandler } from 'ui/handler/input_handler'
import { KeyBindHandler } from 'ui/handler/key_bind_handler'
import { LoginHandler } from 'ui/handler/login_handler'
import { PauseHandler } from 'ui/handler/pause_handler'
import { SettingsHandler } from 'ui/handler/settings_handler'
import { StatsHandler } from 'ui/handler/stats_handler'

import { Vec } from 'util/vector'

export enum Mode {
	UNKNOWN,
	DEFAULT,

	CHAT,
	GAME,
	PAUSE,
}

export enum HandlerType {
	UNKNOWN,

	CHAT,
	INPUT,
	KEY_BIND,
	LOGIN,
	PAUSE,
	SETTINGS,
	STATS,
}

export enum Key {
	UNKNOWN,
	LEFT,
	RIGHT,
	JUMP,
	INTERACT,

	MOUSE_CLICK,
	ALT_MOUSE_CLICK,
}

export enum MouseCoordinates {
	UNKNOWN,
	PIXEL,
	SCREEN,
}

class UI {

	private _mode : Mode;

	private _handlers : Map<HandlerType, Handler>;

	private _chatHandler : ChatHandler;
	private _inputHandler : InputHandler;
	private _keyBindHandler : KeyBindHandler;
	private _loginHandler : LoginHandler;
	private _pauseHandler : PauseHandler;
	private _settingsHandler : SettingsHandler;
	private _statsHandler : StatsHandler;

	constructor() {
		this._mode = Mode.DEFAULT;

		this._handlers = new Map();		

		this._chatHandler = this.add<ChatHandler>(new ChatHandler());
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
	mode() : Mode { return this._mode; }
	setMode(mode : Mode) {
		this._mode = mode;
		this._handlers.forEach((handler) => {
			handler.setMode(mode);
		});	
	}

	chat(msg : string) : void { this._chatHandler.chat(msg); }

	keys() : Set<Key> { return this._inputHandler.keys(); }
	mouse() : Vec { return this._inputHandler.mouse(); }
	resetKeyBinds() : void { this._inputHandler.reset(); }
}

export const ui = new UI();