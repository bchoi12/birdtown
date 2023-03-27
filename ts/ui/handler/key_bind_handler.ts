
import { options } from 'options'

import { ui } from 'ui'
import { HandlerType, UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
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
			get: () => { return options.leftKeyCode; },
			update: (keyCode : number) => { options.leftKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Move right",
			get: () => { return options.rightKeyCode; },
			update: (keyCode : number) => { options.rightKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Jump / double jump",
			get: () => { return options.jumpKeyCode; },
			update: (keyCode : number) => { options.jumpKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Interact",
			get: () => { return options.interactKeyCode; },
			update: (keyCode : number) => { options.interactKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Shoot (LMB)",
			get: () => { return options.mouseClickKeyCode; },
			update: (keyCode : number) => { options.mouseClickKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Use equip (RMB)",
			get: () => { return options.altMouseClickKeyCode; },
			update: (keyCode : number) => { options.altMouseClickKeyCode = keyCode; },
		});

		this.addKeyBind({
			name: "Pause",
			get: () => { return options.pauseKeyCode; },
			update: (keyCode : number) => { options.pauseKeyCode = keyCode; },
		});
		this.addKeyBind({
			name: "Chat",
			get: () => { return options.chatKeyCode; },
			update: (keyCode : number) => { options.chatKeyCode = keyCode; },
		});
		this.addKeyBind({
			name: "Show scoreboard",
			get: () => { return options.scoreboardKeyCode; },
			update: (keyCode : number) => { options.scoreboardKeyCode = keyCode; },
		});
	}

	setup() : void {
		this._keyBindElm.onclick = (e) => {
			e.stopPropagation();
		};
	}

	reset() : void {}

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