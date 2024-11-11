
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class StatusWrapper extends HtmlWrapper<HTMLElement> {

	private _timeoutId : number;

	constructor() {
		super(Html.div());

		this._timeoutId = 0;

		this.elm().classList.add(Html.classOnscreenMessage);
		this.elm().classList.add(Html.classStatusMessage);
	}

	setText(text : string) : void {
		this.elm().textContent = text;
	}

	setHTML(html : string) : void {
		this.elm().innerHTML = html;
	}

	show(ttl? : number, cb? : () => void) : void {
		ui.onFocus(() => {
			this.elm().style.display = "block";

			window.clearTimeout(this._timeoutId);
			if (ttl) {
				this._timeoutId = window.setTimeout(() => {
					this.hide();
					if (cb) {
						cb();
					}
				}, ttl);
			}
		});
	}

	hide() : void {
		this.elm().style.display = "none";
	}
}