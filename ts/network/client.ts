import { Peer, DataConnection } from 'peerjs'

import { game } from 'game'

import { GameMessage, GameMessageType } from 'message/game_message'

import { ChannelType } from 'network/api'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'
import { Netcode, NetcodeOptions } from 'network/netcode'

import { ui } from 'ui'
import { ChatType, DialogType } from 'ui/api'

import { isLocalhost } from 'util/common'

export type ClientOptions = {
	password? : string;
}

export class Client extends Netcode {

	private _tcp : DataConnection;
	private _udp : DataConnection;
	private _options : ClientOptions

	constructor(options : NetcodeOptions) {
		super(options.room);

		this._tcp = null;
		this._udp = null;

		if (!options.clientOptions) {
			console.error("Error: no client options specified.");
		}

		this._options = options.clientOptions;

		this.registerCallbacks();
	}

	override isHost() : boolean { return false; }
	override getPath() : string { return [super.getPath(), this.password(), "0"].join("/"); }
	override password() : string { return this._options.password ? this._options.password : super.password(); }

	override ready() : boolean { return this.initialized() && this._tcp.open && this._udp.open; }
	override initialize(onSuccess : () => void, onError : () => void) : void {
		super.initialize(onSuccess, onError);

		let peer = this.peer();
		peer.on("open", () => {
			console.log("Opened client connection for " + peer.id);

			this.initTCP(onSuccess, onError);
		});

		peer.on("error", (e) => {
			this.initError(onError);
		});

		peer.on("disconnected", () => {
			if (isLocalhost()) {
				console.log("Disconnected from peer server");
			}

			if (!this.initialized()) {
				this.initError(onError);
			}
		});
	}

	override sendChat(clientId : number, message : string) : void {
		if (message.length <= 0) {
			return;
		}

		let msg = new NetworkMessage(NetworkMessageType.CHAT);
		msg.setChatMessage(message);
		msg.setClientId(clientId);
		this.send(this.hostName(), ChannelType.TCP, msg);
	}

	override setVoiceEnabled(enabled : boolean) : void {
		if (this._voiceEnabled === enabled) {
			return;
		}

		let outgoing = new NetworkMessage(NetworkMessageType.VOICE);
		outgoing.setClientId(this.clientId());
		outgoing.setVoiceEnabled(enabled);

		this._voiceEnabled = enabled;

		if (enabled) {
			this.queryMic((stream : MediaStream) => {
				this.send(this.hostName(), ChannelType.TCP, outgoing);
			}, (e) => {
				this._voiceEnabled = false;
				ui.handleVoiceError(this.clientId());
			});
		} else {
			this.send(this.hostName(), ChannelType.TCP, outgoing);
			this.closeMediaConnections();
		}
	}

	private registerCallbacks() : void {
		this.addMessageCallback(NetworkMessageType.INIT_CLIENT, (msg : NetworkMessage) => {
			const clientId = msg.getClientId();
			game.setClientId(clientId);
		});

		this.addMessageCallback(NetworkMessageType.CHAT, (msg : NetworkMessage) => {
			ui.chat(ChatType.CHAT, msg.getChatMessage(), {
				clientId: msg.getClientIdOr(0),
			});
		});

		this.addMessageCallback(NetworkMessageType.VOICE, (msg : NetworkMessage) => {
			if (!msg.getVoiceEnabled()) {
				this.closeMediaConnection(msg.getClientId());
			}
		});

		this.addMessageCallback(NetworkMessageType.VOICE_MAP, (msg : NetworkMessage) => {
			if (!this._voiceEnabled) { return; }

			const clients = new Map<number, string>();
			Object.entries(msg.getClientMap()).forEach(([gameId, name] : [string, string]) => {
				clients.set(Number(gameId), name);
			});
			this.callAll(clients, () => {
				ui.chat(ChatType.LOG, "Joined voice chat!");
			}, () => {
				this._voiceEnabled = false;
				ui.handleVoiceError(this.clientId());
			});
		});
	}

	private initTCP(onSuccess : () => void, onError : () => void) : void {
		let peer = this.peer();

		this._tcp = peer.connect(this.hostName(), {
			reliable: true,
			label: this.channelTypeToLabel(ChannelType.TCP),
			serialization: "raw",
			metadata: {
				password: this.password(),
			}
		});

		this._tcp.on("open", () => {
			console.log("Opened TCP connection for " + peer.id);

			this._pinger.initializeForClient(this);
			this.register(this._tcp);
			this.initUDP(onSuccess, onError);
		});

		this._tcp.on("error", (error) => {
			console.error("TCP connection failed: " + error);

			this.initError(onError);
		});

		this._tcp.on("close", () => {
			console.error("TCP closed!");

			this.closeConnections();
		});
	}

	private initUDP(onSuccess : () => void, onError : () => void) : void {
		let peer = this.peer();

		this._udp = peer.connect(this.hostName(), {
			reliable: false,
			label: this.channelTypeToLabel(ChannelType.UDP),
			serialization: "raw",
			metadata: {
				password: this.password(),
			}
		});

		this._udp.on("open", () => {
			console.log("Opened UDP connection for " + peer.id);

			this.register(this._udp);
			this._initialized = true;

			// Free up Websocket connections on the server.
			// peer.disconnect(); 
			onSuccess();
		});

		this._udp.on("error", (error) => {
			console.error("UDP connection failed: " + error);

			this.initError(onError);
		});

		this._udp.on("close", () => {
			console.error("UDP closed!");

			this.closeConnections();
		});
	}

	private closeConnections() : void {
		let showDialog = true;
		if (this._tcp !== null) {
			this.unregister(this._tcp);
			showDialog = true;
		}
		if (this._udp !== null) {
			this.unregister(this._udp);
			showDialog = true;
		}

		// Show reconnect dialog
		if (this.initialized() && showDialog) {
			if (game.playerInitialized()) {
				ui.forceDialog(DialogType.DISCONNECTED);
			} else {
				ui.forceDialog(DialogType.FAILED_CONNECT);
			}
		}
	}
}