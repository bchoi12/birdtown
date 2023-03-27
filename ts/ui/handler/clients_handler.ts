
import { game } from 'game'

import { ui } from 'ui'
import { HandlerType, UiMode, NewClientMsg } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { Icon } from 'ui/util/icon'
import { ClientWrapper } from 'ui/wrapper/client_wrapper'
import { VoiceWrapper } from 'ui/wrapper/voice_wrapper'

export class ClientsHandler extends HandlerBase implements Handler {

	private _clientsElm : HTMLElement;
	private _clients : Map<number, ClientWrapper>;

	private _stream : MediaStream;
	private _voiceEnabled : boolean;

	constructor() {
		super(HandlerType.CLIENTS);

		this._clientsElm = Html.elm(Html.fieldsetClients);
		this._clients = new Map();
	}

	setup() : void {}

	reset() : void {}

	setMode(mode : UiMode) {}

	addStream(id : number, stream : MediaStream) : void {
		if (!game.netcode().voiceEnabled()) {
			return;
		}

		this._clients.get(id).addStream(stream);
	}

	removeStreams() : void {
		this._clients.forEach((client : ClientWrapper) => {
			client.removeStream();
		});
	}

	onNewClient(msg : NewClientMsg) : void {
		if (this._clients.has(msg.gameId)) {
			console.error("Error: skipping duplicate client in UI");
			return;
		}

		const clientWrapper = new ClientWrapper(msg);
		this._clients.set(msg.gameId, clientWrapper)
		this._clientsElm.appendChild(clientWrapper.elm());
	}
}