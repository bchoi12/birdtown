import { Peer, DataConnection } from 'peerjs'

import { game } from 'game'

import { GameMessage, GameMessageType } from 'message/game_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { ChannelType } from 'network/api'
import { Connection } from 'network/connection'
import { Netcode } from 'network/netcode'

import { ui } from 'ui'
import { ChatType, StatusType, TempStatusType } from 'ui/api'

import { isLocalhost } from 'util/common'

export class Host extends Netcode {

	private static readonly _maxChatLength = 48;

	constructor(room : string) {
		super(room);

		this.registerCallbacks();
	}

	override isHost() : boolean { return true; }

	override ready() : boolean { return this.initialized() && this.peer().open; }
	override initialize(onSuccess : () => void, onError : () => void) : void {
		super.initialize(onSuccess, onError);

		let peer = this.peer();
		peer.on("open", () => {
			console.log(`Opened host connection for ${peer.id}`);

		    peer.on("connection", (connection : DataConnection) => {
		    	connection.on("open", () => {
			    	this.register(connection);
		    	});
		    });

		    peer.on("close", () => {
		    	console.error("Server closed!");
		    });

		    // Wait 1s for any errors to come in
		    setTimeout(() => {
		    	if (!this.hasInitError()) {
					this._pinger.initializeForHost(this);
					this._initialized = true;
					onSuccess();
		    	}
		    }, 1000);
		});

	    peer.on("error", (e) => {
	    	console.error("Host error:", e);

	    	this.initError(onError);
	    });

		peer.on("disconnected", (e) => {
			// TODO: reconnect?
			console.error("Host disconnected:", e);

			this.initError(onError);
		});
	}
	override initError(onError : () => void) : void {
		super.initError(onError);

    	if (this.initialized()) {
	    	ui.showTempStatus(TempStatusType.DISCONNECTED_SIGNALING);
	    	ui.disableStatus(StatusType.LOBBY);
    	}
	}

	private registerCallbacks() : void {
		this.addRegisterCallback((connection : Connection) => {
			const clientId = game.nextClientId();
			connection.setClientId(clientId);
			
			let networkMsg = new NetworkMessage(NetworkMessageType.INIT_CLIENT);
			networkMsg.setClientId(clientId);
			this.send(connection.id(), ChannelType.TCP, networkMsg);

			let gameMsg = new GameMessage(GameMessageType.CLIENT_JOIN);
			gameMsg.setClientId(clientId);
			game.handleMessage(gameMsg);

			if (isLocalhost()) {
				console.log("Registered new client to game:", clientId);
			}
		});

		this.addMessageCallback(NetworkMessageType.CHAT, (msg : NetworkMessage) => {
			this.handleChat(msg.name(), msg.getChatMessage());
		});

		this.addMessageCallback(NetworkMessageType.VOICE, (msg : NetworkMessage) => {
			let connection = this.connection(msg.name());
			connection.setVoiceEnabled(msg.getVoiceEnabled());

			let outgoingMsg = new NetworkMessage(NetworkMessageType.VOICE);
			outgoingMsg.setVoiceEnabled(msg.getVoiceEnabled());
			outgoingMsg.setClientId(msg.getClientId());
			this.broadcast(ChannelType.TCP, outgoingMsg);

			if (outgoingMsg.getVoiceEnabled()) {
				let voiceMapMsg = new NetworkMessage(NetworkMessageType.VOICE_MAP);
				voiceMapMsg.setClientMap(Object.fromEntries(this.getVoiceMap()));
				this.send(msg.name(), ChannelType.TCP, voiceMapMsg);
			} else {
				this.closeMediaConnection(msg.getClientId());
			}
		});
	}

	override sendChat(clientId : number, message : string) : void {
		if (message.length <= 0) {	
			return;
		}

		message = message.substring(0, Host._maxChatLength);

		let msg = new NetworkMessage(NetworkMessageType.CHAT);
		msg.setChatMessage(message);
		msg.setClientId(clientId);
		this.broadcast(ChannelType.TCP, msg);
		ui.chat(ChatType.CHAT, message, {
			clientId: clientId,
		});
	}

	// TODO: de-duplicate code here and above. Probably need to add self as a connection and add some code in send() to trigger callbacks immediately
	override setVoiceEnabled(enabled : boolean) : void {
		if (this._voiceEnabled === enabled) {
			return;
		}

		this._voiceEnabled = enabled;

		let outgoing = new NetworkMessage(NetworkMessageType.VOICE);
		outgoing.setClientId(this.clientId());
		outgoing.setVoiceEnabled(enabled);
		this.broadcast(ChannelType.TCP, outgoing);

		if (this._voiceEnabled) {
			this.callAll(this.getVoiceMap(), () => {
				ui.chat(ChatType.LOG, "Joined voice chat!");
			}, () => {
				this._voiceEnabled = false;
				ui.handleVoiceError(this.clientId());
			});
		} else {
			this.closeMediaConnections();
		}
	}

	private handleChat(fromId : string, message : string) : void {
		if (message.length <= 0) {
			return;
		}

		if (fromId === this.id()) {
			this.sendChat(game.clientId(), message);
		} else if (this.hasConnection(fromId)) {
			this.sendChat(this.connection(fromId).clientId(), message);
		} else {
			console.error("Error: received message from unknown connection", fromId, message);
		}
	}
}