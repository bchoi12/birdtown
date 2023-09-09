import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'

export interface Handler {
	type() : HandlerType;
	setup() : void;
	clear() : void;
	reset() : void;
	handleMessage(msg : UiMessage) : void;
	setMode(mode : UiMode) : void;
}

export class HandlerBase {

	protected _type : HandlerType;

	constructor(type : HandlerType) {
		this._type = type;
	}

	type() : HandlerType { return this._type; }

	setup() : void {}
	clear() : void {}
	reset() : void {}
	handleMessage(msg : UiMessage) : void {}
	setMode(mode : UiMode) : void {}
}