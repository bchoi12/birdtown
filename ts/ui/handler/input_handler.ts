
import { game } from 'game'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'

import { isMobile } from 'util/common'
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

export class InputHandler extends HandlerBase implements Handler {
	private readonly _cursorWidth = 20;
	private readonly _cursorHeight = 20;
	private readonly _aimRadius = 96;

	private _keys : Set<KeyType>;
	private _clearedKeys : Set<KeyType>;
	private _keyMap : Map<number, KeyType>;

	private _keyDownCallbacks : Map<number, (e : any) => void>;
	private _keyUpCallbacks : Map<number, (e : any) => void>;

	private _cursorElm : HTMLElement;
	private _mouse : Vec;

	private _aimElm : HTMLElement;
	private _aimId : number;
	private _aim : Optional<Vec2>;

	constructor() {
		super(HandlerType.INPUT);

		this._keys = new Set();
		this._clearedKeys = new Set();
		this._keyMap = new Map();

		this._keyDownCallbacks = new Map();
		this._keyUpCallbacks = new Map();

		this._cursorElm = Html.elm(Html.cursor);
		this._mouse = {x: 0, y: 0};

		this._aimElm = Html.elm(Html.aim);
		this._aimId = -1;
		this._aim = new Optional();
	}

	override setup() : void {
		if (isMobile()) {
			document.addEventListener("touchstart", (e : any) => { this.updateTouch(e); });
			document.addEventListener("touchmove", (e : any) => { this.updateTouch(e); });
			document.addEventListener("touchend", (e : any) => { this.updateTouch(e); });
		} else {
			document.addEventListener("keydown", (e : any) => {
				if (e.repeat || ui.mode() !== UiMode.GAME) return;

				if (this._keyDownCallbacks.has(e.keyCode)) {
					e.preventDefault();
					this._keyDownCallbacks.get(e.keyCode)(e);
				}
			});
			document.addEventListener("keyup", (e : any) => {
				if (e.repeat || ui.mode() !== UiMode.GAME) return;

				if (this._keyUpCallbacks.has(e.keyCode)) {
					e.preventDefault();
					this._keyUpCallbacks.get(e.keyCode)(e);
				}
			});
			window.onblur = () => {
				this._keys.clear();
			};

	    	document.addEventListener("mousemove", (e: any) => { this.recordMouse(e); });
	    	document.addEventListener("mousedown", (e: any) => { this.mouseDown(e); });
	    	document.addEventListener("mouseup", (e: any) => { this.mouseUp(e); });
			document.addEventListener("pointerlockchange", (e : any) => {
				if (settings.pointerLocked() && !this.pointerLocked() && ui.mode() === UiMode.GAME) {
					ui.setMode(UiMode.SETTINGS);
				}
			});
			document.addEventListener("pointerlockerror", (e : any) => {
				if (ui.mode() !== UiMode.GAME) {
					return;
				}
				setTimeout(() => {
					if (ui.mode() === UiMode.GAME) {
						this.pointerLock();
					}
				}, 1000);
			});
		}

		this.reset();
	}

	override reset() : void {
		this._keyMap.clear();
		this._keyDownCallbacks.clear();
		this._keyUpCallbacks.clear();

		this.mapKey(settings.leftKeyCode, KeyType.LEFT);
		this.mapKey(settings.rightKeyCode, KeyType.RIGHT);
		this.mapKey(settings.jumpKeyCode, KeyType.JUMP);
		this.mapKey(settings.interactKeyCode, KeyType.INTERACT);
		this.mapKey(settings.squawkKeyCode, KeyType.SQUAWK);
		this.mapKey(settings.mouseClickKeyCode, KeyType.MOUSE_CLICK);
		this.mapKey(settings.altMouseClickKeyCode, KeyType.ALT_MOUSE_CLICK);
	}

	override setMode(mode : UiMode) : void {
		if (mode === UiMode.GAME) {
			this.pointerLock();
		} else {
			this._keys.clear();
			this.pointerUnlock();
		}
	}

	keys() : Set<number> { return this._keys; }
	clearKeys() : void {
		this._clearedKeys.forEach((type : KeyType) => {
			this._keys.delete(type);
		});
		this._clearedKeys.clear();
	}
	mouse() : Vec { return this._mouse; }

	private mapKey(keyCode : number, key : KeyType) {
		this._keyMap.set(keyCode, key);

		this._keyDownCallbacks.set(keyCode, (e : any) => { this.recordKeyDown(e); });
		this._keyUpCallbacks.set(keyCode, (e : any) => { this.recordKeyUp(e); });
	}

	private updateTouch(e : any) : void {
		let keyMap = new Map<KeyType, boolean>([
			[KeyType.LEFT, false],
			[KeyType.RIGHT, false],
			[KeyType.JUMP, false],
			[KeyType.ALT_MOUSE_CLICK, false],
			[KeyType.MOUSE_CLICK, false],
		]);

		let resetAim = true;
		if (e.touches && ui.mode() === UiMode.GAME) {
			for (let i = 0; i < e.touches.length; ++i) {
				const touch = e.touches[i];

				if (this._aim.has() && this._aimId === touch.identifier) {
					this.updateAim(touch);
					resetAim = false;
					continue;
				}

				const ratioX = touch.clientX / window.innerWidth;
				const ratioY = touch.clientY / window.innerHeight;
				if (ratioY < 0.2) {
					if (ratioX < 0.5) {
						keyMap.set(KeyType.ALT_MOUSE_CLICK, true);
					} else {
						keyMap.set(KeyType.MOUSE_CLICK, true);
					}
				} else if (ratioX > 0.85) {
					keyMap.set(KeyType.RIGHT, true);
				} else if (ratioX < 0.2) {
					keyMap.set(KeyType.LEFT, true);
				} else if (ratioY > 0.8) {
					keyMap.set(KeyType.JUMP, true);
				} else if (!this._aim.has()) {
					this.updateAim(touch);
					resetAim = false;
				}
			}
		}

		if (resetAim) {
			this.resetAim();
		}

		keyMap.forEach((down : boolean, type : KeyType) => {
			if (down) {
				this.keyDown(type);
			} else {
				this.keyUp(type);
			}
		});
	}

	private updateAim(touch : Touch) : void {
		if (!this._aim.has()) {
			this._aimId = touch.identifier;
			this._aim.set(Vec2.fromVec({x: touch.clientX, y: touch.clientY }));
			this._aimElm.style.visibility = "visible";
			this._aimElm.style.left = (this._aim.get().x - this._aimRadius) + "px";
			this._aimElm.style.top = (this._aim.get().y - this._aimRadius) + "px";
		}

		this._mouse.x = window.innerWidth / 2 + touch.clientX - this._aim.get().x;
		this._mouse.y = window.innerHeight / 2 + touch.clientY - this._aim.get().y;
	}
	private resetAim() : void {
		this._aimElm.style.visibility = "hidden";
		this._aimId = -1;
		this._aim.clear();
	}

	private recordKeyDown(e : any) : void {
		if (!this._keyMap.has(e.keyCode)) return;

		const key = this._keyMap.get(e.keyCode);
		this.keyDown(key);
	}
	private recordKeyUp(e : any) : void {
		if (!this._keyMap.has(e.keyCode)) return;

		const key = this._keyMap.get(e.keyCode);
		this.keyUp(key);
	}

	private mouseDown(e : any) : void {
		let button = KeyType.MOUSE_CLICK;
	    if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
	        button = KeyType.ALT_MOUSE_CLICK;
	    }
	    this.keyDown(button);
	}

	private mouseUp(e : any) : void {
		let button = KeyType.MOUSE_CLICK;
	    if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
	        button = KeyType.ALT_MOUSE_CLICK;
	    }
	    this.keyUp(button);
	}

	private keyDown(type : KeyType) : void {
		if (ui.mode() !== UiMode.GAME) {
			return;
		}
		if (!this._keys.has(type)) {
			this._keys.add(type);
		}
	}
	private keyUp(type : KeyType) : void {
		if (this._keys.has(type)) {
			this._clearedKeys.add(type);
		}
	}

	private pointerLock() : void {
		if (settings.pointerLocked()) {
			game.canvas().requestPointerLock();
		}
	}
	private pointerUnlock() : void { document.exitPointerLock(); }
	private pointerLocked() : boolean { return document.pointerLockElement === game.canvas(); }

	private recordMouse(e : any) : void {
		if (!this.pointerLocked()) {
			this._mouse.x = e.clientX;
			this._mouse.y = e.clientY;
		} else {
			this._mouse.x += e.movementX;
			this._mouse.y += e.movementY;
    	}

		if (this._mouse.x > window.innerWidth) {
			this._mouse.x = window.innerWidth;
		} else if (this._mouse.x < 0) {
			this._mouse.x = 0;
		}
		if (this._mouse.y > window.innerHeight) {
			this._mouse.y = window.innerHeight;
		} else if (this._mouse.y < 0) {
			this._mouse.y = 0;
		}

		if (this.pointerLocked()) {
			this._cursorElm.style.visibility = "visible";
			this._cursorElm.style.left = (this._mouse.x - this._cursorWidth / 2) + "px";
			this._cursorElm.style.top = (this._mouse.y - this._cursorHeight / 2) + "px";
		} else {
			this._cursorElm.style.visibility = "hidden";
		}
	}
}