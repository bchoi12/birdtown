
import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, KeyType } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
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

		let keys = new CategoryWrapper();
		keys.setTitle("Gameplay");
		this._keyBindElm.appendChild(keys.elm());

		this.addKeyBind(keys, {
			name: "Move Left",
			type: KeyType.LEFT,
		});

		this.addKeyBind(keys, {
			name: "Move Right",
			type: KeyType.RIGHT,
		});

		this.addKeyBind(keys, {
			name: "Jump / Double Jump",
			type: KeyType.JUMP,
		});

		this.addKeyBind(keys, {
			name: "Squawk",
			type: KeyType.SQUAWK,
		});
		this.addKeyBind(keys, {
			name: "Interact",
			type: KeyType.INTERACT,
		});
		this.addMenuKeyBind(keys, {
			name: "Lock Mouse",
			get: () => { return settings.pointerLockKeyCode; },
			update: (keyCode : number) => { settings.pointerLockKeyCode = keyCode; },
		});

		let mouse = new CategoryWrapper();
		mouse.setTitle("Mouse Shortcuts");
		this._keyBindElm.appendChild(mouse.elm());

		this.addKeyBind(mouse, {
			name: "Use Weapon",
			type: KeyType.MOUSE_CLICK,
		});
		this.addKeyBind(mouse, {
			name: "Use Equip",
			type: KeyType.ALT_MOUSE_CLICK,
		});

		let menu = new CategoryWrapper();
		menu.setTitle("Menu Keys");
		this._keyBindElm.appendChild(menu.elm());

		this.addMenuKeyBind(menu, {
			name: "Chat / Submit",
			get: () => { return settings.chatKeyCode; },
			update: (keyCode : number) => { settings.chatKeyCode = keyCode; },
		}); 
		this.addMenuKeyBind(menu, {
			name: "Open Menu",
			get: () => { return settings.menuKeyCode; },
			update: (keyCode : number) => { settings.menuKeyCode = keyCode; },
		});
		this.addMenuKeyBind(menu,{
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

	private addKeyBind(category : CategoryWrapper, options : KeyBindOptions) : void {
		this.addMenuKeyBind(category, {
			name: options.name,
			get: () => { return settings.keyCode(options.type); },
			update: (keyCode : number) => { settings.keyCodes.set(options.type, keyCode); }
		});
	}

	private addMenuKeyBind(category : CategoryWrapper, wrapperOptions : KeyBindWrapperOptions) : void {
		let binding = new KeyBindWrapper(wrapperOptions);
		category.contentElm().appendChild(binding.elm());
		this._keyBindWrappers.push(binding);
	}
}