
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'

import { isMobile } from 'util/common'
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

enum TouchType {
	UNKNOWN,

	START,
	MOVE,
	END,
}

// TODO: setting
enum AimMode {
	UNKNOWN,

	TOUCH,
	JOYSTICK,
}

export class InputHandler extends HandlerBase implements Handler {

	private static readonly _aimRadius = 96;
	private static readonly _cursorWidth = 20;
	private static readonly _cursorHeight = 20;

	private _keys : Set<KeyType>;
	private _clearedKeys : Set<KeyType>;
	private _keyMap : Map<number, KeyType>;

	private _keyDownCallbacks : Map<number, (e : any) => void>;
	private _keyUpCallbacks : Map<number, (e : any) => void>;

	private _screenElm : HTMLElement;
	private _cursorElm : HTMLElement;
	private _mouse : Vec2;

	private _aimMode : AimMode;
	private _aimElm : HTMLElement;
	private _aimId : Optional<number>;
	private _aim : Optional<Vec2>;

	constructor() {
		super(HandlerType.INPUT);

		this._keys = new Set();
		this._clearedKeys = new Set();
		this._keyMap = new Map();

		this._keyDownCallbacks = new Map();
		this._keyUpCallbacks = new Map();

		this._screenElm = Html.elm(Html.divScreen);
		this._cursorElm = Html.elm(Html.cursor);
		this._mouse = Vec2.zero();

		this._aimMode = AimMode.TOUCH;
		this._aimElm = Html.elm(Html.aim);
		this._aimId = new Optional();
		this._aim = new Optional();
	}

	override setup() : void {
		if (isMobile()) {
			document.addEventListener("touchstart", (e : any) => { this.updateTouch(e, TouchType.START); });
			document.addEventListener("touchmove", (e : any) => { this.updateTouch(e, TouchType.MOVE); });
			document.addEventListener("touchend", (e : any) => { this.updateTouch(e, TouchType.END); });
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

	    	document.addEventListener("mousemove", (e: any) => {
	    		if (ui.mode() !== UiMode.GAME) return;

	    		this.recordMouse(e);
	    	});
	    	document.addEventListener("mousedown", (e: any) => {
	    		if (ui.mode() !== UiMode.GAME || ui.usingTray()) return;

	    		this.mouseDown(e);
	    	});
	    	document.addEventListener("mouseup", (e: any) => {
	    		if (ui.mode() !== UiMode.GAME) return;

	    		this.mouseUp(e);
	    	});
		}

		this.reset();
	}

	override reset() : void {
		super.reset();

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

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		if (mode !== UiMode.GAME) {
			this._keys.clear();
		}
	}

	keys() : Set<number> { return this._keys; }
	clearKeys() : void {
		this._clearedKeys.forEach((type : KeyType) => {
			this._keys.delete(type);
		});
		this._clearedKeys.clear();
	}
	mouse() : Vec2 { return this._mouse; }

	screenRect() : DOMRect { return this._screenElm.getBoundingClientRect(); }
	inputWidth() : number { return window.innerWidth; }
	inputHeight() : number { return window.innerHeight; }

	private mapKey(keyCode : number, key : KeyType) {
		this._keyMap.set(keyCode, key);

		this._keyDownCallbacks.set(keyCode, (e : any) => { this.recordKeyDown(e); });
		this._keyUpCallbacks.set(keyCode, (e : any) => { this.recordKeyUp(e); });
	}

	private updateTouch(e : any, type : TouchType) : void {
		let keys = new Set();
		let keyMap = new Map<KeyType, boolean>([
			[KeyType.LEFT, false],
			[KeyType.RIGHT, false],
			[KeyType.JUMP, false],
			[KeyType.INTERACT, false],
			[KeyType.ALT_MOUSE_CLICK, false],
			[KeyType.MOUSE_CLICK, false],
		]);

		let resetAim = true;
		if (e.touches && ui.mode() === UiMode.GAME) {
			for (let i = 0; i < e.touches.length; ++i) {
				const touch = e.touches[i];

				if (this._aimId.has() && this._aimId.get() === touch.identifier) {
					this.updateAim(touch);
					resetAim = false;
					continue;
				}

				const ratioX = touch.clientX / this.inputWidth();
				const ratioY = touch.clientY / this.inputHeight();

				if (ratioY < 0.2) {
					if (ratioX < 0.2 || ratioX > 0.8) {
						keyMap.set(KeyType.MOUSE_CLICK, true);
					} else if (ratioX > 0.4 && ratioX < 0.6) {
						keyMap.set(KeyType.INTERACT, true);
					}
				} else if (ratioY > 0.8) {
					if (ratioX < 0.2 || ratioX > 0.8) {
						keyMap.set(KeyType.ALT_MOUSE_CLICK, true);
					} else {
						keyMap.set(KeyType.JUMP, true);
					}
				} else if (ratioX < 0.15) {
					keyMap.set(KeyType.LEFT, true);
				} else if (ratioX > 0.85) {
					keyMap.set(KeyType.RIGHT, true);
				} else if (!this._aimId.has() || type === TouchType.START) {
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
		const screen = this.screenRect();

		if (!this._aim.has() || this._aimId.get() !== touch.identifier) {
			this._aimId.set(touch.identifier);
			this._aim.set(Vec2.fromVec({x: touch.clientX, y: touch.clientY }));

			if (this._aimMode === AimMode.JOYSTICK) {
				this._aimElm.style.visibility = "visible";
				this._aimElm.style.left = (this._aim.get().x - InputHandler._aimRadius) + "px";
				this._aimElm.style.top = (this._aim.get().y - InputHandler._aimRadius) + "px";
			}
		}

		if (this._aimMode === AimMode.TOUCH) {
			this._mouse.x = touch.clientX;
			this._mouse.y = touch.clientY;
		} else {
			this._mouse.x = this.inputWidth() / 2 + touch.clientX - this._aim.get().x;
			this._mouse.y = this.inputHeight() / 2 + touch.clientY - this._aim.get().y;
		}
	}
	private resetAim() : void {
		this._aimElm.style.visibility = "hidden";
		this._aimId.clear();
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

	private recordMouse(e : any) : void {
		const screen = this.screenRect();

		if (!ui.isPointerLocked()) {
			this._mouse.x = e.clientX;
			this._mouse.y = e.clientY;
		} else {
			this._mouse.x += e.movementX;
			this._mouse.y += e.movementY;

			this._mouse.max({x: 0, y: 0 });
			this._mouse.min({x: screen.width, y:screen.height });
    	}

		if (ui.isPointerLocked()) {
			this._cursorElm.style.visibility = "visible";
			this._cursorElm.style.left = (this._mouse.x - InputHandler._cursorWidth / 2) + "px";
			this._cursorElm.style.top = (this._mouse.y - InputHandler._cursorHeight / 2) + "px";
		} else {
			this._mouse.sub({ x: screen.left, y: screen.top });
			this._cursorElm.style.visibility = "hidden";
		}
	}
}