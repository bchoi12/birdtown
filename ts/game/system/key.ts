
import { StepData } from 'game/game_object'
import { ClientSideSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { ui } from 'ui'
import { KeyType, KeyState } from 'ui/api'

export class Key extends ClientSideSystem implements System {

	private _keyType : KeyType;
	private _counter : number;
	// Counter from network connection, either behind (if host) or ahead ()
	private _networkCounter : number;
	private _changed : boolean;

	constructor(keyType : KeyType, clientId : number) {
		super(SystemType.KEY, clientId);

		this.addNameParams({
			base: "key",
			type: KeyType[keyType],
			id: this.clientId(),
		});

		this._keyType = keyType;
		this._counter = 0;
		this._networkCounter = 0;
		this._changed = false;

		this.addProp<number>({
			export: () => { return this._counter; },
			import: (obj : number) => { this._networkCounter = obj; },
			validate: (obj : number) => { this._networkCounter = obj; },
		});
	}

	keyType() : KeyType { return this._keyType; }
	diff() : number { return this._counter - this._networkCounter; }
	keyState() : KeyState {
		if (this.released()) { return KeyState.RELEASED; }
		if (this.up()) { return KeyState.UP; }
		if (this.pressed()) { return KeyState.PRESSED; }
		if (this.down()) { return KeyState.DOWN; }

		return KeyState.UNKNOWN;
	}
	up() : boolean { return this._counter % 2 === 0; }
	released() : boolean { return this.up() && this._changed; }
	down() : boolean { return this._counter % 2 === 1; }
	pressed() : boolean { return this.down() && this._changed; }

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		this._changed = false;
		if (this.isSource()) {
			if (ui.keys().has(this._keyType)) {
				this.press();
			} else {
				this.release();
			}
		} else {
			if (this._networkCounter > this._counter) {
				if (this.up()) {
					this.press();
				} else {
					this.release();
				}
			}
		}
	}

	private press() : void {
		if (this.up()) {
			this._changed = true;
			this._counter++;
		}
	}

	private release() : void {
		if (this.down()) {
			this._changed = true;
			this._counter++;
		}
	}
}