
import { Handler } from 'ui/handler'
import { Input } from 'ui/handler/input'
import { Login } from 'ui/handler/login'
import { Pause } from 'ui/handler/pause'
import { Settings } from 'ui/handler/settings'
import { Stats } from 'ui/handler/stats'

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
}

class UI {

	private _mode : Mode;

	private _handlers : Map<HandlerType, Handler>;
	private _input : Input;
	private _login : Login;
	private _pause : Pause;
	private _settings : Settings;
	private _stats : Stats;

	constructor() {
		this._mode = Mode.DEFAULT;

		this._handlers = new Map();		

		this._input = new Input();
		this._handlers.set(this._input.type(), this._input);

		this._login = new Login();
		this._handlers.set(this._login.type(), this._login);

		this._pause = new Pause();
		this._handlers.set(this._pause.type(), this._pause);

		this._settings = new Settings();
		this._handlers.set(this._settings.type(), this._settings);

		this._stats = new Stats();
		this._handlers.set(this._stats.type(), this._stats);
	}

	setup() : void {
		this._handlers.forEach((handler) => {
			handler.setup();
		});
	}

	get(type : HandlerType) : Handler { return this._handlers.get(type); }
	mode() : Mode { return this._mode; }
	keys() : Set<Key> { return this._input.keys(); }

	setMode(mode : Mode) {
		this._mode = mode;
		this._handlers.forEach((handler) => {
			handler.setMode(mode);
		});	
	}
}

export const ui = new UI();