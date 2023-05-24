
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { KeyBindWrapper, KeyBindWrapperOptions } from 'ui/wrapper/key_bind_wrapper'

export class KeyBindHandler extends HandlerBase implements Handler {
	private _keyBindElm : HTMLElement;
	private _keyBindWrappers : Array<KeyBindWrapper>;

	constructor() {
		super(HandlerType.KEY_BIND);

		this._keyBindElm = Html.elm(Html.fieldsetKeyBind);
		this._keyBindWrappers = new Array();

		this.addKeyBind({
			name: "Move left",
			get: () => { return settings.leftKeyCode; },
			update: (keyCode : number) => { settings.leftKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Move right",
			get: () => { return settings.rightKeyCode; },
			update: (keyCode : number) => { settings.rightKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Jump / double jump",
			get: () => { return settings.jumpKeyCode; },
			update: (keyCode : number) => { settings.jumpKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Interact",
			get: () => { return settings.interactKeyCode; },
			update: (keyCode : number) => { settings.interactKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Shoot (LMB)",
			get: () => { return settings.mouseClickKeyCode; },
			update: (keyCode : number) => { settings.mouseClickKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Use equip (RMB)",
			get: () => { return settings.altMouseClickKeyCode; },
			update: (keyCode : number) => { settings.altMouseClickKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Pause",
			get: () => { return settings.pauseKeyCode; },
			update: (keyCode : number) => { settings.pauseKeyCode = keyCode; },
		});
		this.addKeyBind({
			name: "Chat",
			get: () => { return settings.chatKeyCode; },
			update: (keyCode : number) => { settings.chatKeyCode = keyCode; },
		});
		this.addKeyBind({
			name: "Show scoreboard",
			get: () => { return settings.scoreboardKeyCode; },
			update: (keyCode : number) => { settings.scoreboardKeyCode = keyCode; },
		});
	}

	setup() : void {
		this._keyBindElm.onclick = (e) => {
			e.stopPropagation();
		};
	}

	reset() : void {}

	handleMessage(msg : UiMessage) : void {}

	setMode(mode : UiMode) : void {
		if (mode === UiMode.PAUSE) {
			this._keyBindWrappers.forEach((wrapper) => {
				wrapper.setActive(false);
			})
		}
	}

	private addKeyBind(wrapperOptions : KeyBindWrapperOptions) : void {
		let binding = new KeyBindWrapper(wrapperOptions);
		this._keyBindElm.append(binding.elm());
		this._keyBindWrappers.push(binding);
	}
}