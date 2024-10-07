
import { game } from 'game'

import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { ChatType, TooltipType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { Icon, IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ClientWrapper } from 'ui/wrapper/client_wrapper'
import { ContainerWrapper } from 'ui/wrapper/container_wrapper'

export class ClientsHandler extends HandlerBase implements Handler {

	private _clientsElm : HTMLElement;
	private _clients : Map<number, ClientWrapper>;
	private _containerWrapper : ContainerWrapper;
	private _sendChat : boolean;

	private _stream : MediaStream;

	constructor() {
		super(HandlerType.CLIENTS);

		this._clientsElm = Html.elm(Html.fieldsetClients);

		this._clients = new Map();
		this._containerWrapper = new ContainerWrapper();
		this._clientsElm.appendChild(this._containerWrapper.elm());

		this._sendChat = false;
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		this._sendChat = true;

		ui.chat(ChatType.PRINT, "just joined!", {
			clientId: game.clientId(),
		});
	}

	override handleClientMessage(msg : GameMessage) : void {
		super.handleClientMessage(msg);

		if (msg.type() === GameMessageType.CLIENT_INIT) {
			const clientId = msg.getClientId();

			// Support name changes for existing clients
			if (this._clients.has(clientId)) {
				this._clients.get(clientId).setDisplayName(msg.getDisplayName());
				return;
			}

			let clientWrapper = new ClientWrapper(msg);
			this._containerWrapper.elm().appendChild(clientWrapper.elm());
			this._clients.set(clientId, clientWrapper)

			if (this._sendChat) {
				ui.chat(ChatType.PRINT, "just joined!", {
					clientId: clientId,
				});
			}
		} else if (msg.type() === GameMessageType.CLIENT_DISCONNECT) {
			const clientId = msg.getClientId();

			if (!this._clients.has(clientId)) {
				return;
			}

			let clientWrapper = this._clients.get(clientId);

			if (this._sendChat) {
				ui.chat(ChatType.PRINT, "disconnected!", {
					clientId: clientId,
				});
			}

			this._containerWrapper.elm().removeChild(clientWrapper.elm());
			this._clients.delete(clientId);
		}
	}

	hasClient(id : number) : boolean { return this._clients.has(id); }
	getClient(id : number) : ClientWrapper { return this._clients.get(id); }

	addStream(clientId : number, stream : MediaStream) : void {
		if (!game.netcode().voiceEnabled()) {
			return;
		}

		if (!this._clients.has(clientId)) {
			console.error("Error: UI missing client %d", clientId);
			return;
		}

		this._clients.get(clientId).addStream(stream);
	}

	removeStream(clientId : number) : void {
		if (!this._clients.has(clientId)) {
			return;
		}

		this._clients.get(clientId).removeStream();
	}

	removeStreams() : void {
		this._clients.forEach((client : ClientWrapper) => {
			client.removeStream();
		});
	}
}