
import { ui } from 'ui'
import { TooltipType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

import { Optional } from 'util/optional'

export class TooltipWrapper extends HtmlWrapper<HTMLElement> {

	private _timeoutId : Optional<number>;

	constructor() {
		super(Html.div());

		this._timeoutId = new Optional();

		this.elm().classList.add(Html.classTooltip);
		this.elm().classList.add(Html.classPopup);

		setTimeout(() => {
			this.elm().classList.add(Html.classPopupShow);
		}, 5);
	}

	setTTL(ttl : number, onDelete : () => void) : void {
		if (this._timeoutId.has()) {
			window.clearTimeout(this._timeoutId.get());
		}

		this._timeoutId.set(window.setTimeout(() => {
			this.delete(onDelete);
		}, ttl));
	}

	delete(onDelete : () => void) : void {
		if (!this.elm() || !this.elm().parentNode) {
			return;
		}
		this.elm().parentNode.removeChild(this.elm());
		onDelete();
	}
}