import { Peer } from 'peerjs'

import { MessageType, Payload } from 'network/api'
import { Netcode, ChannelType } from 'network/netcode'

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
		this.addMessageCallback(MessageType.CHAT, (payload : Payload) => {
			this.handleChat(payload.name, <string>payload.msg.D);
		});

		this.addMessageCallback(MessageType.VOICE, (payload : Payload) => {
			const voiceEnabled = <boolean>payload.msg.D;

			let connection = this.getConnection(payload.name);
			connection.setVoiceEnabled(voiceEnabled);

			if (voiceEnabled) {
				this.send(payload.name, ChannelType.TCP, {
					T: MessageType.VOICE_MAP,
					D: Object.fromEntries(this.getVoiceMap()),
				});
				this.sendMessage(connection.displayName() + " joined voice chat");
			}
		});
	}

	override sendChat(message : string) : void { this.handleChat(this.name(), message); }
	override setVoiceEnabled(enabled : boolean) : boolean {
		if (this._voiceEnabled === enabled) {
			return this._voiceEnabled;
		}

		this._voiceEnabled = enabled;

		if (this._voiceEnabled) {
			this.callAll(this.getVoiceMap());
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
		this.broadcast(ChannelType.TCP, {
			T: MessageType.CHAT,
			D: fullMessage,
		});
		ui.chat(fullMessage);	
	}
}