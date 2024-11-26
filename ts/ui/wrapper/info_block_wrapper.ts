
import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'

import { IconWrapper } from 'ui/wrapper/icon_wrapper'

export class InfoBlockWrapper extends IconWrapper {

	private _visible : boolean;

	constructor() {
		super();

		this.elm().classList.add(Html.classInfoBlock);

		this._visible = false;
	}

	override setText(text : string) : void {
		super.setText(text);

		if (this.iconElm().innerHTML === "" && this.textElm().innerHTML === "") {
			this.hide();
		}
	}
	override setIconN(type : IconType, n : number) : void {
		super.setIconN(type, n);

		if (this.iconElm().innerHTML === "" && this.textElm().innerHTML === "") {
			this.hide();
		}
	}

	empty() : boolean { return this.iconElm().innerHTML === "" && this.textElm().innerHTML === ""; }
	show() : void {
		if (this._visible) {
			return;
		}

		if (this.empty()) {
			return;
		}

		this.elm().style.display = "inline-block";
		this._visible = true;
	}
	hide() : void {
		if (!this._visible) {
			return;
		}

		this.elm().style.display = "none";
		this._visible = false;
	}
}