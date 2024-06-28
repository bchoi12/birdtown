
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class FooterWrapper extends HtmlWrapper<HTMLElement> {

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classFooter);
	}
}