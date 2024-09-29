

import { Html, HtmlWrapper } from 'ui/html'
import { InfoWrapper } from 'ui/wrapper/info_wrapper'

export class ScoreboardWrapper extends HtmlWrapper<HTMLElement> {

	private _infoWrapper : InfoWrapper;

	constructor() {
		super(Html.div());

		this._infoWrapper = new InfoWrapper();

		this.elm().appendChild(this._infoWrapper.elm());
		this.elm().style.opacity = "1";
	}

	show() : void {

	}

	hide() : void {

	}

	infoWrapper() : InfoWrapper { return this._infoWrapper; }
}