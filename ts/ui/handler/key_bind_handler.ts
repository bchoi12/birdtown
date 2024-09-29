
import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { KeyBindWrapper, KeyBindWrapperOptions } from 'ui/wrapper/label/key_bind_wrapper'

export class KeyBindHandler extends HandlerBase implements Handler {
	private _keyBindElm : HTMLElement;
	private _keyBindWrappers : Array<KeyBindWrapper>;

	constructor() {
		super(HandlerType.KEY_BIND);

		this._keyBindElm = Html.elm(Html.fieldsetKeyBind);
		this._keyBindWrappers = new Array();
	}

	override setup() : void {
		super.setup();

		this._keyBindElm.onclick = (e) => {
			e.stopPropagation();
		};

		this.addKeyBind({
			name: "Move Left",
			get: () => { return settings.leftKeyCode; },
			update: (keyCode : number) => { settings.leftKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Move Right",
			get: () => { return settings.rightKeyCode; },
			update: (keyCode : number) => { settings.rightKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Jump / Double Jump",
			get: () => { return settings.jumpKeyCode; },
			update: (keyCode : number) => { settings.jumpKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Squawk",
			get: () => { return settings.squawkKeyCode; },
			update: (keyCode : number) => { settings.squawkKeyCode = keyCode; },
		});
		this.addKeyBind({
			name: "Interact",
			get: () => { return settings.interactKeyCode; },
			update: (keyCode : number) => { settings.interactKeyCode = keyCode; },
		});
		this.addKeyBind({
			name: "Lock Mouse",
			get: () => { return settings.pointerLockKeyCode; },
			update: (keyCode : number) => { settings.pointerLockKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Use Weapon (LMB)",
			get: () => { return settings.mouseClickKeyCode; },
			update: (keyCode : number) => { settings.mouseClickKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Use Equip (RMB)",
			get: () => { return settings.altMouseClickKeyCode; },
			update: (keyCode : number) => { settings.altMouseClickKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Open Menu",
			get: () => { return settings.menuKeyCode; },
			update: (keyCode : number) => { settings.menuKeyCode = keyCode; },
		});
		this.addKeyBind({
			name: "Open Chat",
			get: () => { return settings.chatKeyCode; },
			update: (keyCode : number) => { settings.chatKeyCode = keyCode; },
		});
		this.addKeyBind({
			name: "Open Scoreboard",
			get: () => { return settings.scoreboardKeyCode; },
			update: (keyCode : number) => { settings.scoreboardKeyCode = keyCode; },
		});
	}

	override reset() : void {
		super.reset();

		this._keyBindWrappers.forEach((wrapper) => {
			wrapper.setActive(false);
		});
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		this.reset();
	}

	private addKeyBind(wrapperOptions : KeyBindWrapperOptions) : void {
		let binding = new KeyBindWrapper(wrapperOptions);
		this._keyBindElm.append(binding.elm());
		this._keyBindWrappers.push(binding);
	}
}