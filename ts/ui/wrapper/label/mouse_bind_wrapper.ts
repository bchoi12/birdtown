
import { SoundType } from 'game/factory/api'
import { SoundFactory } from 'game/factory/sound_factory'

import { settings } from 'settings'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { KeyNames } from 'ui/common/key_names'
import { LabelButtonWrapper } from 'ui/wrapper/label/label_button_wrapper'

export type MouseBindWrapperOptions = {
	name : string;
	get : () => number;
	update : (mouseCode : number) => void;
}

export class MouseBindWrapper extends LabelButtonWrapper {

	private _update : (mouseCode : number) => void;
	private _get : () => number;

	constructor(options : MouseBindWrapperOptions) {
		super();

		this.setName(options.name);

		this._update = options.update;
		this._get = options.get;

		this.updateText()

		this.elm().addEventListener("contextmenu", (e) => {
			this.updateCode(e);
			return false;
		})
		this.elm().onclick = (e : any) => {
			this.updateCode(e);
		};
		this.elm().onauxclick = (e : any) => {
			this.updateCode(e);
		};
	}

	private updateCode(e : any) : void {
		e.preventDefault();

		if ("button" in e) {
			this._update(e.button);
		} else {
			console.error("Failed to update mouse bindings: no button property", e);
			return;
		}

		SoundFactory.play(SoundType.CLICK);
		this.updateText();
		ui.resetKeyBinds();
	}

	updateText() : void {
		this.setButtonHTML(KeyNames.mkbd(this._get()));
	}
}