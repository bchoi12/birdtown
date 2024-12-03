
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class StatusWrapper extends HtmlWrapper<HTMLElement> {

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classOnscreenMessage);
		this.elm().classList.add(Html.classStatusMessage);
	}

	setText(text : string) : void {
		this.elm().textContent = text;
	}

	setHTML(html : string) : void {
		this.elm().innerHTML = html;
	}

	show() : void {
		this.elm().style.display = "block";
	}

	hide() : void {
		this.elm().style.display = "none";
	}
}