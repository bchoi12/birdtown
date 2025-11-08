
import { StepData } from 'game/game_object'
import { ClientSideSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, KeyState } from 'ui/api'

enum ToggleState {
	UNKNOWN,

	READY,
	START,
	HOLD,
}

export class Key extends ClientSideSystem implements System {

	// Max key press/release to replay
	private static readonly _maxReplay = 3;

	private _keyType : KeyType;
	private _counter : number;
	// Counter from network connection. Behind if source, otherwise ahead.
	private _networkCounter : number;
	private _changed : boolean;
	private _toggle : ToggleState;

	constructor(keyType : KeyType, clientId : number) {
		super(SystemType.KEY, clientId);

		this.addNameParams({
			type: KeyType[keyType],
		});

		this._keyType = keyType;
		this._counter = 0;
		this._networkCounter = 0;
		this._changed = false;
		this._toggle = ToggleState.READY;

		this.addProp<number>({
			export: () => { return this._counter; },
			import: (obj : number) => {
				if (this._counter === 0 && this._networkCounter === 0) {
					// Initialize
					this._counter = obj;
				}
				this._networkCounter = Math.max(this._networkCounter, obj);
			},
			validate: (obj : number) => { this._networkCounter = Math.max(this._networkCounter, obj); },
			options: {
				conditionalInterval: (obj: number, elapsed : number) => {
					// Periodically broadcast key is no longer pressed
					return obj % 2 === 0 && elapsed >= 3000;
				},
			}
		});
	}

	keyType() : KeyType { return this._keyType; }
	counter() : number { return this._counter; }
	diff() : number { return this._counter - this._networkCounter; }
	checkState(state : KeyState) : boolean {
		switch (state) {
		case KeyState.RELEASED:
			return this.released();
		case KeyState.UP:
			return this.up();
		case KeyState.PRESSED:
			return this.pressed();
		case KeyState.DOWN:
			return this.down();
		}
		return false;
	}
	down() : boolean { return this._counter % 2 === 1; }
	pressed() : boolean { return this.down() && this._changed; }
	up() : boolean { return !this.down(); }
	released() : boolean { return this.up() && this._changed; }

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		this._changed = false;
		if (this.isSource()) {
			if (!settings.allowKeyLock(this._keyType)) {
				this._toggle = ToggleState.READY;
			}

			if (ui.keys().has(this._keyType)) {
				this.press();
			} else {
				this.release();
			}
		} else {
			if (this._networkCounter > this._counter) {
				if (this._networkCounter > this._counter + 2 * Key._maxReplay) {
					this._counter = this._networkCounter - 2 * Key._maxReplay;
				}

				if (this.up()) {
					this.press();
				} else {
					this.release();
				}
			} else {
				this._counter = this._networkCounter;
			}
		}
	}

	private press() : void {
		if (this._toggle === ToggleState.HOLD) {
			this._toggle = ToggleState.READY;
		} else if (this.up()) {
			this._changed = true;
			this._counter++;

			// Lock key press
			if (settings.allowKeyLock(this._keyType)) {
				this._toggle = ToggleState.START;
			}
		}
	}

	private release() : void {
		if (this._toggle === ToggleState.START || this._toggle === ToggleState.HOLD) {
			this._toggle = ToggleState.HOLD;
			return;
		}

		if (this.down()) {
			this._changed = true;
			this._counter++;
		}
	}
}