
import { options } from 'options'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export type ClientWrapperOptions = {
	displayName : string
}

export class ClientWrapper extends HtmlWrapper {

	constructor(options : ClientWrapperOptions) {
		super(Html.div());

		this.elm().textContent = options.displayName;
	}
}