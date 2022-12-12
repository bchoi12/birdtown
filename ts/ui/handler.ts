
import { HandlerType, Mode } from 'ui'

export interface Handler {
	type() : HandlerType;
	setup() : void;
	reset() : void;
	setMode(mode : Mode) : void;
}

export class HandlerBase {

	protected _type : HandlerType;

	constructor(type : HandlerType) {
		this._type = type;
	}

	type() : HandlerType {
		return this._type;
	}
}