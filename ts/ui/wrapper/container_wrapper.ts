
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class ContainerWrapper extends HtmlWrapper<HTMLElement> {

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classContainer);
	}
}