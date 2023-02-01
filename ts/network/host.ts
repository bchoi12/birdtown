import { Peer } from 'peerjs'

import { MessageType } from 'network/message'
import { Netcode, ChannelType } from 'network/netcode'

import { ui } from 'ui'

export class Host extends Netcode {

	private _initialized : boolean;

	constructor(displayName : string, hostName : string) {
		super(displayName, hostName);

		this._peer = new Peer(hostName, {
			debug: 2,
			pingInterval: 5000,
		});

		this._initialized = false;
	}

	override isHost() : boolean { return true; }

	override initialized() : boolean { return this._initialized; }
	override ready() : boolean { return this.initialized() && this.peer().open; }
	override initialize() : void {
		let peer = this.peer();

		peer.on("open", () => {
			console.log("Opened host connection for " + peer.id);

		    peer.on("connection", (connection) => {
		    	connection.on("open", () => {
			    	this.register(connection);
		    	});
		    });

		    peer.on("close", () => {
		    	console.error("Server closed!");
		    })

		    peer.on("error", (error) => {
		    	// TODO: actually do something
		    	console.error(error);
		    });

			this._pinger.initializeForHost(this);
			this._initialized = true;
		});

		peer.on("disconnected", () => {
			peer.reconnect();
		});
	}

	override sendChat(message : string) : void {
		this.receiveChat(this.name(), message);
	}

	override receiveChat(from : string, message : string) : void {
		if (message.length <= 0) {
			return;
		}

		let displayName;
		if (from === this.name()) {
			displayName = this.displayName();
		} else if (this.hasConnection(from)) {
			displayName = this.getConnection(from).displayName();
		} else {
			return;
		}

		const fullMessage = displayName + ": " + message;
		this.broadcast(ChannelType.TCP, {
			T: MessageType.CHAT,
			D: fullMessage,
		});
		ui.chat(fullMessage);
	}
}