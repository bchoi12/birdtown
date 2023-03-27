
import { game } from 'game'

import { options } from 'options'

import { ui } from 'ui'
import { HandlerType, Key, UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { Html } from 'ui/html'
import { Vec } from 'util/vector'

export class InputHandler extends HandlerBase implements Handler {
	private readonly _cursorWidth = 20;
	private readonly _cursorHeight = 20;

	private _keys : Set<Key>;
	private _keyMap : Map<number, Key>;

	private _keyDownCallbacks : Map<number, (e : any) => void>;
	private _keyUpCallbacks : Map<number, (e : any) => void>;

	private _cursorElm : HTMLElement;
	private _mouse : Vec;

	constructor() {
		super(HandlerType.INPUT);

		this._keys = new Set<number>();
		this._keyMap = new Map();

		this._keyDownCallbacks = new Map();
		this._keyUpCallbacks = new Map();

		this._cursorElm = Html.elm(Html.cursor);
		this._mouse = {x: 0, y: 0};
	}

	setup() : void {
		document.addEventListener("keydown", (e : any) => {
			if (e.repeat || ui.mode() !== UiMode.GAME) return;

			if (this._keyDownCallbacks.has(e.keyCode)) {
				this._keyDownCallbacks.get(e.keyCode)(e);
			}
		});
		document.addEventListener("keyup", (e : any) => {
			if (e.repeat || ui.mode() !== UiMode.GAME) return;

			if (this._keyUpCallbacks.has(e.keyCode)) {
				this._keyUpCallbacks.get(e.keyCode)(e);
			}
		});
		window.onblur = () => {
			this._keys.clear();
		};

    	document.addEventListener("mousemove", (e : any) => { this.recordMouse(e); });
    	document.addEventListener("mousedown", (e : any) => { this.mouseDown(e); });
    	document.addEventListener("mouseup", (e : any) => { this.mouseUp(e); });
		document.addEventListener("pointerlockchange", (e : any) => {
			if (options.enablePointerLock && !this.pointerLocked() && ui.mode() === UiMode.GAME) {
				ui.setMode(UiMode.PAUSE);
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

		this.reset();
	}

	reset() : void {
		this._keyMap.clear();
		this._keyDownCallbacks.clear();
		this._keyUpCallbacks.clear();

		this.mapKey(options.leftKeyCode, Key.LEFT);
		this.mapKey(options.rightKeyCode, Key.RIGHT);
		this.mapKey(options.jumpKeyCode, Key.JUMP);
		this.mapKey(options.interactKeyCode, Key.INTERACT);
		this.mapKey(options.mouseClickKeyCode, Key.MOUSE_CLICK);
		this.mapKey(options.altMouseClickKeyCode, Key.ALT_MOUSE_CLICK);
	}

	setMode(mode : UiMode) : void {
		if (mode === UiMode.GAME) {
			this.pointerLock();
		} else {
			this._keys.clear();
			this.pointerUnlock();
		}
	}

	keys() : Set<number> { return this._keys; }
	mouse() : Vec { return this._mouse; }

	private mapKey(keyCode : number, key : Key) {
		this._keyMap.set(keyCode, key);

		this._keyDownCallbacks.set(keyCode, (e : any) => { this.recordKeyDown(e); });
		this._keyUpCallbacks.set(keyCode, (e : any) => { this.recordKeyUp(e); });
	}

	private recordKeyDown(e : any) : void {
		if (!this._keyMap.has(e.keyCode)) return;

		const key = this._keyMap.get(e.keyCode);
		if (!this._keys.has(key)) {
			this._keys.add(key);
		}
	}

	private recordKeyUp(e : any) : void {
		if (!this._keyMap.has(e.keyCode)) return;

		const key = this._keyMap.get(e.keyCode);
		if (this._keys.has(key)) {
			this._keys.delete(key);
		}
	}

	private mouseDown(e : any) : void {
		if (ui.mode() !== UiMode.GAME) {
			return;
		}

		let button = Key.MOUSE_CLICK;
	    if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
	        button = Key.ALT_MOUSE_CLICK;
	    }

		if (!this._keys.has(button)) {
			this._keys.add(button);
		}
	}

	private mouseUp(e : any) : void {
		if (ui.mode() != UiMode.GAME) {
			return;
		}

		let button = Key.MOUSE_CLICK;
	    if ("which" in e && e.which == 3 || "button" in e && e.button == 2) {
	        button = Key.ALT_MOUSE_CLICK;
	    }

		this._keys.delete(button);
	}

	private pointerLock() : void {
		if (options.enablePointerLock) {
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