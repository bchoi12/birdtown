
import { game } from 'game'

import { ui, HandlerType, Mode } from 'ui'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { ClientWrapper } from 'ui/wrapper/client_wrapper'

export class ClientsHandler extends HandlerBase implements Handler {

	private _clientsElm : HTMLElement;

	constructor() {
		super(HandlerType.CLIENTS);

		this._clientsElm = Html.elm(Html.fieldsetClients);
	}

	setup() : void {}

	reset() : void {}

	setMode(mode : Mode) {}

	onNewClient(displayName : string) : void {
		const clientWrapper = new ClientWrapper({
			displayName: displayName,
		});

		this._clientsElm.appendChild(clientWrapper.elm());
	}
}