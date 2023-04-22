
import { ui } from 'ui'
import { TooltipType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

import { defined } from 'util/common'

export class TooltipWrapper extends HtmlWrapper {

	private _timeoutId : number;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classTooltip);

		setTimeout(() => {
			this.elm().classList.add(Html.classTooltipShow);
		}, 5);
	}

	setTTL(ttl : number, onDelete : () => void) : void {
		if (defined(this._timeoutId)) {
			window.clearTimeout(this._timeoutId);
		}

		this._timeoutId = window.setTimeout(() => {
			this.delete(onDelete);
		}, ttl);
	}

	delete(onDelete : () => void) : void {
		this.elm().parentNode.removeChild(this.elm());
		onDelete();
	}
}