
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class DialogDivWrapper extends HtmlWrapper<HTMLElement> {

	constructor() {
		super(Html.div());
	}
}