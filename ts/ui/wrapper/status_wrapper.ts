
import { ui } from 'ui'
import { TooltipType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

export class StatusWrapper extends HtmlWrapper<HTMLElement> {

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classStatusMessage);
	}

	setText(text : string) : void {
		this.elm().textContent = text;
	}

	show() : void {
		this.elm().style.display = "block";
	}

	hide() : void {
		this.elm().style.display = "none";
	}
}