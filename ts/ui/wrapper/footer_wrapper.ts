
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class FooterWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _css = `
		width: 100%;
		min-height: 1em;
		position: absolute;
		bottom: 0px;
	`

	constructor() {
		super(Html.div());

		this.elm().style.cssText = FooterWrapper._css;
	}
}