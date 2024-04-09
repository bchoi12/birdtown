import { settings } from 'settings'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { KeyNames } from 'ui/common/key_names'
import { LabelButtonWrapper } from 'ui/wrapper/label_button_wrapper'

export type KeyBindWrapperOptions = {
	name : string;
	get : () => number;
	update : (keyCode : number) => void;
}

export class KeyBindWrapper extends LabelButtonWrapper {

	private _active : boolean;
	private _update : (keyCode : number) => void;
	private _get : () => number;

	constructor(options : KeyBindWrapperOptions) {
		super();

		this.setLabel(options.name);

		this._active = false;
		this._update = options.update;
		this._get = options.get;

		this.update();
		this.elm().onclick = (e) => {
			this.setActive(!this._active);
		};

		document.addEventListener("keydown", (e) => {
			if (!this._active || !e.keyCode) {
				return;
			}

			this._update(e.keyCode)
			this.setActive(false);
			ui.resetKeyBinds();
			e.preventDefault();
		});
	}

	setActive(active : boolean) : void {
		if (this._active !== active) {
			this._active = active;
			this.update();
		}
	}

	update() : void {
		if (this._active) {
			this.setText("[Press a key]");
		} else {
			let key = KeyNames.get(this._get());
			this.setText("[" + key + "]");
		}
	}
}