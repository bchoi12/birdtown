
import { StepData } from 'game/game_object'
import { ClientSideSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { ui } from 'ui'
import { KeyType, KeyState } from 'ui/api'

export class Key extends ClientSideSystem implements System {

	// Max key press/release to replay
	private static readonly _maxReplay = 3;

	private _keyType : KeyType;
	private _counter : number;
	// Counter from network connection. Behind if source, otherwise ahead.
	private _networkCounter : number;
	private _changed : boolean;

	constructor(keyType : KeyType, clientId : number) {
		super(SystemType.KEY, clientId);

		this.addNameParams({
			type: KeyType[keyType],
		});

		this._keyType = keyType;
		this._counter = 0;
		this._networkCounter = 0;
		this._changed = false;

		this.addProp<number>({
			export: () => { return this._counter; },
			import: (obj : number) => { this._networkCounter = Math.max(this._networkCounter, obj); },
			validate: (obj : number) => { this._networkCounter = Math.max(this._networkCounter, obj); },
			options: {
				conditionalInterval: (obj: number, elapsed : number) => {
					// Periodically broadcast key is no longer pressed
					return obj % 2 === 0 && elapsed >= 2000;
				},
			}
		});
	}

	keyType() : KeyType { return this._keyType; }
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