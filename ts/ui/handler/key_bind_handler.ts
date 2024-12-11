
import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, KeyType } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { KeyBindWrapper, KeyBindWrapperOptions } from 'ui/wrapper/label/key_bind_wrapper'

type KeyBindOptions = {
	name : string;
	type : KeyType;
}

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
			type: KeyType.LEFT,
		});

		this.addKeyBind({
			name: "Move Right",
			type: KeyType.RIGHT,
		});

		this.addKeyBind({
			name: "Jump / Double Jump",
			type: KeyType.JUMP,
		});

		this.addKeyBind({
			name: "Squawk",
			type: KeyType.SQUAWK,
		});
		this.addKeyBind({
			name: "Interact",
			type: KeyType.INTERACT,
		});
		this.addMenuKeyBind({
			name: "Lock Mouse",
			get: () => { return settings.pointerLockKeyCode; },
			update: (keyCode : number) => { settings.pointerLockKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Use Weapon (LMB)",
			type: KeyType.MOUSE_CLICK,
		});

		this.addKeyBind({
			name: "Use Equip (RMB)",
			type: KeyType.ALT_MOUSE_CLICK,
		});

		this.addMenuKeyBind({
			name: "Chat / Submit",
			get: () => { return settings.chatKeyCode; },
			update: (keyCode : number) => { settings.chatKeyCode = keyCode; },
		});
		this.addMenuKeyBind({
			name: "Open Menu",
			get: () => { return settings.menuKeyCode; },
			update: (keyCode : number) => { settings.menuKeyCode = keyCode; },
		});
		this.addMenuKeyBind({
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

	private addKeyBind(options : KeyBindOptions) : void {
		this.addMenuKeyBind({
			name: options.name,
			get: () => { return settings.keyCode(options.type); },
			update: (keyCode : number) => { settings.keyCodes.set(options.type, keyCode); }
		});
	}

	private addMenuKeyBind(wrapperOptions : KeyBindWrapperOptions) : void {
		let binding = new KeyBindWrapper(wrapperOptions);
		this._keyBindElm.append(binding.elm());
		this._keyBindWrappers.push(binding);
	}
}