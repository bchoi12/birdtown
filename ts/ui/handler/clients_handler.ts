
import { game } from 'game'

import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { Icon, IconType } from 'ui/util/icon'
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

	handleMessage(msg : UiMessage) : void {
		if (msg.type() !== UiMessageType.CLIENT) {
			return;
		}

		const clientId = msg.getProp<number>(UiProp.CLIENT_ID);

		if (this._clients.has(clientId)) {
			console.error("Error: skipping duplicate client in UI");
			return;
		}

		const clientWrapper = new ClientWrapper(msg);
		this._clients.set(clientId, clientWrapper)
		this._clientsElm.appendChild(clientWrapper.elm());
	}

	setMode(mode : UiMode) {}

	addStream(gameId : number, stream : MediaStream) : void {
		if (!game.netcode().voiceEnabled()) {
			return;
		}

		if (!this._clients.has(gameId)) {
			console.error("Error: UI missing client %d", gameId);
			return;
		}

		this._clients.get(gameId).addStream(stream);
	}

	removeStream(gameId : number) : void {
		if (!this._clients.has(gameId)) {
			return;
		}

		this._clients.get(gameId).removeStream();
	}

	removeStreams() : void {
		this._clients.forEach((client : ClientWrapper) => {
			client.removeStream();
		});
	}
}