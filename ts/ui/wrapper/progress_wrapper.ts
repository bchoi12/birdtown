
import { ui } from 'ui'
import { HudType, HudOptions } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

import { Fns } from 'util/fns'

export class ProgressWrapper extends HtmlWrapper<HTMLElement> {

	private _color : string;
	private _percent : number;

	constructor() {
		super(Html.div());

		this._color = "";
		this._percent = 1;

		this.elm().classList.add(Html.classProgress);
		this.setColor("#FFFFFF");
	}

	setPercent(percent : number) : void {
		// Rate limit since this is expensive
		if (percent === 0 || percent === 1) {
			// Don't use tolerance for empty or full
			if (this._percent === percent) {
				return;
			}
		} else if (Math.abs(this._percent - percent) < .05) {
			return;
		}

		this._percent = percent;
		this.elm().style.width = Fns.clamp(0, 100 * percent, 100) + "%";
	}

	setColor(color : string) : void {
		if (this._color === color) {
			return;
		}

		this._color = color;
		this.elm().style.backgroundColor = this._color;
	}
}