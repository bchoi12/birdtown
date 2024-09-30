import { GameMessage } from 'message/game_message'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'

import { Optional } from 'util/optional'

export interface Handler {
	type() : HandlerType;
	setup() : void;
	clear() : void;
	reset() : void;
	handleClientMessage(msg : GameMessage) : void;

	enabled() : boolean;
	enable() : void;
	disable() : void;
	onEnable() : void;
	onDisable() : void;
	onModeChange(mode : UiMode, oldMode : UiMode) : void;
	onPlayerInitialized() : void;
}

export type HandlerOptions = {
	mode? : UiMode;
}

export class HandlerBase {

	protected _type : HandlerType;
	protected _enabled : boolean;

	private _mode : Optional<UiMode>;

	constructor(type : HandlerType, options? : HandlerOptions) {
		this._type = type;
		this._enabled = false;

		if (!options) {
			options = {};
		}

		this._mode = new Optional(options.mode);
	}

	type() : HandlerType { return this._type; }

	setup() : void {}
	clear() : void {}
	reset() : void {}
	handleClientMessage(msg : GameMessage) : void {}

	enabled() : boolean { return this._enabled && ui.mode() === this._mode.get(); }
	enable() : void {
		if (!this._mode.has()) {
			console.error("Error: trying to enable handler %s with no mode set", HandlerType[this._type]);
			return;
		}

		if (this._enabled) {
			return;
		}

		this._enabled = true;
		ui.setMode(this._mode.get());
		this.onEnable();
	}
	disable() : void {
		if (!this._enabled) {
			return;
		}

		this._enabled = false;
		if (ui.mode() === this._mode.get()) {
			ui.setMode(UiMode.GAME);
		}
		this.onDisable();
	}
	onEnable() : void {}
	onDisable() : void {}
	onModeChange(mode : UiMode, oldMode : UiMode) : void {
		if (this._enabled && mode !== this._mode.get()) {
			this.disable();
		}
	}

	onPlayerInitialized() : void {}
}