import { Peer, DataConnection } from 'peerjs'

import { game } from 'game'

import { Flags } from 'global/flags'
import { GameGlobals } from 'global/game_globals'

import { GameMessage, GameMessageType } from 'message/game_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { ChannelType } from 'network/api'
import { Connection } from 'network/connection'
import { Netcode, NetcodeOptions } from 'network/netcode'

import { settings } from 'settings'

import { ui } from 'ui'
import { ChatType, StatusType } from 'ui/api'

export type HostOptions = {
	publicRoom : boolean;
	maxPlayers : number;
	name : string;
	latlng : string;
}

export class Host extends Netcode {

	private static readonly _maxChatLength = 48;
	private static readonly _maxPrintLength = 128;

	private _options : HostOptions;

	constructor(options : NetcodeOptions) {
		super(options);

		if (!options.hostOptions) {
			console.error("Error: no host options were specified.");
		}

		this._options = options.hostOptions;

		this.registerCallbacks();
	}

	override isHost() : boolean { return true; }
	override getParams() : string {
		return [
			"h",
			this._options.publicRoom ? "pub" : "prv",
			this.maxPlayers(),
			this._options.name,
			this._options.latlng,
			GameGlobals.version,
			settings.sessionToken,
		].join("!");
	}
	maxPlayers() : number { return this._options.maxPlayers; }

	override ready() : boolean { return this.initialized() && this.peer().open; }
	override initialize(onSuccess : () => void, onError : () => void) : void {
		super.initialize(onSuccess, onError);

		let peer = this.peer();
		peer.on("open", () => {
			console.log(`Opened host connection for ${peer.id}`);

		    peer.on("connection", (connection : DataConnection) => {
		    	connection.on("open", () => {
		    		if (!this.canOpen(connection)) {
		    			connection.close();
		    			return;
		    		}

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
    		ui.setSignalingDisconnected(true);
    	}
	}

	private canOpen(connection : DataConnection) : boolean {
		if (this._options.maxPlayers > 0 && this.getNumConnected() >= this._options.maxPlayers) {
			console.error("Warning: rejected connection since game is full %d/%d", this.getNumConnected(), this._options.maxPlayers);
			return false;
		}

		if (this.password() !== "" && this.password() !== connection.metadata?.password) {
			console.error("Warning: rejected connection with password %s (not %s)", connection.metadata?.password, this.password());
			return false;
		}

		return true;
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

			if (Flags.printDebug.get()) {
				console.log("Registered new client to game:", clientId);
			}
		});

		this.addMessageCallback(NetworkMessageType.CHAT, (msg : NetworkMessage) => {
			this.handleChat(msg.name(), msg.getChatType(), msg.getChatMessage());
		});

		this.addMessageCallback(NetworkMessageType.JOIN_VOICE, (msg : NetworkMessage) => {
			this.handleChat(msg.name(), ChatType.PRINT, "joined voice chat!");
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

	override sendChat(type : ChatType, message : string) : void {
		this.sendChatFrom(game.clientId(), type, message);
	}

	private sendChatFrom(clientId : number, type : ChatType, message : string) : void {
		if (message.length <= 0) {	
			return;
		}

		if (type === ChatType.PRINT) {
			message = message.substring(0, Host._maxPrintLength);
		} else {
			message = message.substring(0, Host._maxChatLength);
		}

		let msg = new NetworkMessage(NetworkMessageType.CHAT);
		msg.setChatMessage(message);
		msg.setChatType(type);
		msg.setClientId(clientId);
		this.broadcast(ChannelType.TCP, msg);
		ui.chat(type, message, {
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
				this.sendChat(ChatType.PRINT, "joined voice chat!");
			}, () => {
				this._voiceEnabled = false;
				ui.handleVoiceError(this.clientId());
			});
		} else {
			this.closeMediaConnections();
		}
	}

	override onKick(clientId : number) : void {
		super.onKick(clientId);

		this.sendChatFrom(clientId, ChatType.PRINT, "was banned!");
		game.playerState(clientId)?.chat("BANNED!");
	}

	private handleChat(fromId : string, type : ChatType, message : string) : void {
		if (message.length <= 0) {
			return;
		}

		if (fromId === this.id()) {
			this.sendChat(type, message);
		} else if (this.hasConnection(fromId)) {
			this.sendChatFrom(this.connection(fromId).clientId(), type, message);
		} else {
			console.error("Error: received message from unknown connection", fromId, message);
		}
	}
}