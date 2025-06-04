
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, KeyType, TooltipType } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

export class PointerLockHandler extends HandlerBase implements Handler {

	private _requested : boolean;

	constructor() {
		super(HandlerType.POINTER_LOCK);

		this._requested = false;
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode !== settings.keyCode(KeyType.POINTER_LOCK)) return;

			const lockPointer = !this.pointerLocked();

			if (lockPointer) {
				ui.showTooltip(TooltipType.POINTER_LOCK, { ttl: 1500 });
			}

			this.setPointerLockRequested(lockPointer);
		});

		document.addEventListener("pointerlockchange", (e : any) => {
			if (ui.mode() !== UiMode.GAME) { return; }

			if (this.pointerLockRequested() && !this.pointerLocked()) {
				ui.openMenu();
			}
		});
	}

	setPointerLockRequested(requested : boolean) : void {
		this._requested = requested;

		this.updatePointerLock();
	}
	pointerLockRequested() : boolean { return this._requested; }
	pointerLocked() : boolean { return document.pointerLockElement === game.canvas(); }

	private updatePointerLock() : void {
		if (this._requested && ui.mode() === UiMode.GAME) {
			game.canvas().requestPointerLock();
		} else if (this.pointerLocked()) {
			document.exitPointerLock();
		}
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		this.updatePointerLock();
	}
}