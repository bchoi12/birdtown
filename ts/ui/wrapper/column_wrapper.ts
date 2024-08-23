
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class ColumnWrapper extends HtmlWrapper<HTMLElement> {

	private _legendElm : HTMLElement;
	private _contentElm : HTMLElement;

	constructor() {
		super(Html.fieldset());

		this.elm().classList.add(Html.classColumn);

		this._legendElm = Html.legend();
		this._legendElm.classList.add(Html.classNoSelect);
		this.elm().appendChild(this._legendElm);

		this._contentElm = Html.div();
		this._contentElm.style.overflow = "scroll";
		this.elm().appendChild(this._contentElm);
	}

	setLegend(name : string) : void {
		this._legendElm.textContent = name;

		if (name.length > 0) {
			this.elm().style.borderTop = "1px solid";
		} else {
			this.elm().style.borderTop = "0";
		}

		this._legendElm.style.visibility = name.length > 0 ? "visible" : "hidden";
	}

	contentElm() : HTMLElement { return this._contentElm; }
}