import { Peer } from 'peerjs'

import { ChannelType } from 'network/api'
import { MessageType } from 'network/message/api'
import { NetworkMessage, NetworkProp } from 'network/message/network_message'
import { Netcode } from 'network/netcode'

import { ui } from 'ui'

export class Host extends Netcode {

	constructor(hostName : string, displayName : string) {
		super(hostName, hostName, displayName);
	}

	override isHost() : boolean { return true; }
	override ready() : boolean { return this.initialized() && this.peer().open; }
	override initialize() : void {
		super.initialize();

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

		    this.registerCallbacks();
			this._pinger.initializeForHost(this);
			this._initialized = true;
		});

		peer.on("disconnected", () => {
			peer.reconnect();
		});
	}

	private registerCallbacks() : void {
		this.addMessageCallback(MessageType.CHAT, (msg : NetworkMessage) => {
			this.handleChat(msg.name(), msg.getProp<string>(NetworkProp.STRING));
		});

		this.addMessageCallback(MessageType.VOICE, (msg : NetworkMessage) => {
			let connection = this.getConnection(msg.name());
			connection.setVoiceEnabled(msg.getProp<boolean>(NetworkProp.ENABLED));

			let outgoingMsg = new NetworkMessage(MessageType.VOICE);
			outgoingMsg.setProp<boolean>(NetworkProp.ENABLED, msg.getProp<boolean>(NetworkProp.ENABLED));
			outgoingMsg.setProp<number>(NetworkProp.CLIENT_ID, msg.getProp<number>(NetworkProp.CLIENT_ID));
			this.broadcast(ChannelType.TCP, outgoingMsg);

			if (outgoingMsg.getProp<boolean>(NetworkProp.ENABLED)) {
				let voiceMapMsg = new NetworkMessage(MessageType.VOICE_MAP);
				voiceMapMsg.setProp<Object>(NetworkProp.CLIENT_MAP, Object.fromEntries(this.getVoiceMap()));
				this.send(msg.name(), ChannelType.TCP, voiceMapMsg);
				this.sendMessage(connection.displayName() + " joined voice chat");
			} else {
				this.closeMediaConnection(msg.getProp<number>(NetworkProp.CLIENT_ID));
			}
		});
	}

	override sendChat(message : string) : void { this.handleChat(this.name(), message); }

	// TODO: de-duplicate code here and above. Probably need to add self as a connection and add some code in send() to trigger callbacks immediately
	override setVoiceEnabled(enabled : boolean) : boolean {
		if (this._voiceEnabled === enabled) {
			return this._voiceEnabled;
		}

		this._voiceEnabled = enabled;

		let outgoing = new NetworkMessage(MessageType.VOICE);
		outgoing.setProp<number>(NetworkProp.CLIENT_ID, this.gameId())
			.setProp<boolean>(NetworkProp.ENABLED, enabled);
		this.broadcast(ChannelType.TCP, outgoing);

		if (this._voiceEnabled) {
			this.sendMessage(this.displayName() + " joined voice chat");
			this.callAll(this.getVoiceMap());
		} else {
			this.closeMediaConnections();
		}
		return this._voiceEnabled;
	}

	private handleChat(from : string, message : string) : void {
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
		this.sendMessage(fullMessage);
	}

	private sendMessage(fullMessage : string) : void {
		let msg = new NetworkMessage(MessageType.CHAT);
		msg.setProp<string>(NetworkProp.STRING, fullMessage);
		this.broadcast(ChannelType.TCP, msg);
		ui.chat(fullMessage);
	}
}