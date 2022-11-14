
import { Input } from 'ui/input'

export enum InputMode {
	UNKNOWN = 0,
	DEFAULT = 1,
	GAME = 2,
}

class UI {

	private _input : Input;

	constructor() {
		this._input = new Input();
	}

	keys() {
		return this._input.keys();
	}
}

export const ui = new UI();