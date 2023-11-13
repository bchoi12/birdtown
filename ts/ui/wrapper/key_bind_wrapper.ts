import { settings } from 'settings'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { KeyNames } from 'ui/util/key_names'

export type KeyBindWrapperOptions = {
	name : string;
	get : () => number;
	update : (keyCode : number) => void;
}


export class KeyBindWrapper extends HtmlWrapper<HTMLElement> {
	private _name : string;
	private _active : boolean;
	private _update : (keyCode : number) => void;
	private _get : () => number;

	private _nameElm : HTMLElement;
	private _keyElm : HTMLElement;

	constructor(wrapperOptions : KeyBindWrapperOptions) {
		super(Html.div());

		this.elm().classList.add(Html.classTextButton);
		this.elm().classList.add(Html.classKeyBind);

		this._nameElm = Html.div();
		this._nameElm.style.float = "left";
		this._nameElm.textContent = wrapperOptions.name;

		this.elm().appendChild(this._nameElm);
		this._keyElm = Html.div();
		this._keyElm.style.float = "right";
		this.elm().appendChild(this._keyElm);

		this._update = wrapperOptions.update;
		this._get = wrapperOptions.get;

		this.setActive(false);
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
			this._keyElm.textContent = "[Press a key]";
		} else {
			let key = KeyNames.get(this._get());
			this._keyElm.textContent = "[" + key + "]";
		}
	}
}