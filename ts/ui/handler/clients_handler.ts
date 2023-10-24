
import { game } from 'game'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { Icon, IconType } from 'ui/util/icon'
import { ClientWrapper } from 'ui/wrapper/client_wrapper'

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

	override handleMessage(msg : UiMessage) : void {
		if (msg.type() === UiMessageType.CLIENT_JOIN) {
			const clientId = msg.getClientId();

			// Support name changes for existing clients
			if (this._clients.has(clientId)) {
				this._clients.get(clientId).setDisplayName(msg.getDisplayName());
				return;
			}

			let clientWrapper = new ClientWrapper(msg);
			this._clientsElm.appendChild(clientWrapper.elm());
			this._clients.set(clientId, clientWrapper)

			ui.chat(clientWrapper.displayName() + " joined!");

		} else if (msg.type() === UiMessageType.CLIENT_DISCONNECT) {
			const clientId = msg.getClientId();

			if (!this._clients.has(clientId)) {
				return;
			}

			let clientWrapper = this._clients.get(clientId);
			ui.chat(clientWrapper.displayName() + " disconnected");

			this._clientsElm.removeChild(clientWrapper.elm());
			this._clients.delete(clientId);
		}
	}

	hasClient(id : number) : boolean { return this._clients.has(id); }
	getClient(id : number) : ClientWrapper { return this._clients.get(id); }

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