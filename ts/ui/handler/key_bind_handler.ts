
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
		this.addKeyBind(keys, {
			name: "Lock Mouse",
			type: KeyType.POINTER_LOCK,
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
		menu.setTitle("Menu");
		this._keyBindElm.appendChild(menu.elm());

		this.addKeyBind(menu, {
			name: "Chat / Submit",
			type: KeyType.CHAT,
		}); 
		this.addKeyBind(menu, {
			name: "Open Menu",
			type: KeyType.MENU,
		});
		this.addKeyBind(menu,{
			name: "Open Scoreboard",
			type: KeyType.SCOREBOARD,
		});
		this.addKeyBind(menu,{
			name: "Screenshot (WIP)",
			type: KeyType.PHOTO,
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
		let binding = new KeyBindWrapper({
			name: options.name,
			get: () => { return settings.keyCode(options.type); },
			update: (keyCode : number) => { settings.setKeyCode(options.type, keyCode); }
		});

		category.contentElm().appendChild(binding.elm());
		this._keyBindWrappers.push(binding);
	}
}