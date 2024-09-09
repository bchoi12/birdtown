
import { game } from 'game'

import { ui } from 'ui'
import { HudType, HudOptions } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

export class ProgressWrapper extends HtmlWrapper<HTMLElement> {

	private _percent : number;

	constructor() {
		super(Html.div());

		this._percent = 1;

		this.elm().classList.add(Html.classProgress);

		if (game.lakitu().validTargetEntity()) {
			this.elm().style.color = game.lakitu().targetEntity().clientColorOr("#FFFFFF");
		}
	}

	setPercent(percent : number) : void {
		this._percent = percent;

		this.elm().style.width = Math.min(Math.max(0, 100 * percent), 100) + "%";
	}

	setColor(color : string) : void {
		this.elm().style.backgroundColor = color;
	}
}