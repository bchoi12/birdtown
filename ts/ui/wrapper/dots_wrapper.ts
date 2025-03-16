
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class DotsWrapper extends HtmlWrapper<HTMLElement> {

	private _dots : number;

	constructor() {
		super(Html.span());

		this._dots = 0;
	}

	clear() : void {
		this.elm().textContent = "";
		this._dots = 0;
	}

	increment() : void {
		if (this._dots >= 3) {
			this.clear();
			return;
		}

		this.elm().textContent += ".";
		this._dots++;
	}
}