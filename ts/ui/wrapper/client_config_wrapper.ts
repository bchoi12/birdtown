
import { ClientConfig } from 'game/util/client_config'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class ClientConfigWrapper extends HtmlWrapper<HTMLElement> {

	private _config : ClientConfig;

	constructor() {
		super(Html.div());
	}

	

}