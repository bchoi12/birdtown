import { Peer, DataConnection } from 'peerjs'

import { game } from 'game'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ChannelType } from 'network/api'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'
import { Netcode } from 'network/netcode'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

import { isLocalhost } from 'util/common'

export class Client extends Netcode {

	private _tcp : DataConnection;
	private _udp : DataConnection;

	constructor(room : string) {
		super(room, /*isHost=*/false);
	}

	override isHost() : boolean { return false; }

	override ready() : boolean { return this.initialized() && this._tcp.open && this._udp.open; }
	override initialize() : void {
		super.initialize();

		this.addMessageCallback(NetworkMessageType.INIT_CLIENT, (msg : NetworkMessage) => {
			const clientId = msg.getClientId();
			game.setClientId(clientId);
		});

		let peer = this.peer();
		peer.on("open", () => {
			if (isLocalhost()) {
				console.log("Opened client connection for " + peer.id);
			}

			this.registerCallbacks();
			this._pinger.initializeForClient(this);
			this.initTCP();
		});

		peer.on("error", (e) => {
	    	const uiMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
	    	uiMsg.setAnnouncementType(AnnouncementType.DISCONNECTED);
	    	uiMsg.setTtl(60 * 1000);
	    	ui.handleMessage(uiMsg);
		});

		peer.on("disconnected", () => {
			// TODO: reconnect?
		});
	}

	override sendChat(message : string) : void {
		if (message.length <= 0) {
			return;
		}

		let msg = new NetworkMessage(NetworkMessageType.CHAT);
		msg.setChatMessage(message);
		this.send(this.hostName(), ChannelType.TCP, msg);
	}

	override setVoiceEnabled(voiceEnabled : boolean) : boolean {
		if (this._voiceEnabled === voiceEnabled) {
			return this._voiceEnabled;
		}

		let outgoing = new NetworkMessage(NetworkMessageType.VOICE);
		outgoing.setClientId(this.clientId());
		outgoing.setVoiceEnabled(voiceEnabled);

		const sent = this.send(this.hostName(), ChannelType.TCP, outgoing);
		if (sent) {
			this._voiceEnabled = voiceEnabled;
		}

		if (!this._voiceEnabled) {
			this.closeMediaConnections();
		} 

		return this._voiceEnabled;
	}

	private registerCallbacks() : void {
		this.addMessageCallback(NetworkMessageType.CHAT, (msg : NetworkMessage) => {
			ui.chat(msg.getChatMessage());
		});

		this.addMessageCallback(NetworkMessageType.VOICE, (msg : NetworkMessage) => {
			if (!msg.getVoiceEnabled()) {
				this.closeMediaConnection(msg.getClientId());
			}
		});

		this.addMessageCallback(NetworkMessageType.VOICE_MAP, (msg : NetworkMessage) => {
			if (!this._voiceEnabled) { return; }

			const clients = new Map<number, string>();
			console.log("Receive voice map", msg);
			Object.entries(msg.getClientMap()).forEach(([gameId, name] : [string, string]) => {
				clients.set(Number(gameId), name);
			});
			this.callAll(clients);
		});
	}

	private initTCP() : void {
		let peer = this.peer();

		this._tcp = peer.connect(this.hostName(), {
			reliable: true,
			label: this.channelTypeToLabel(ChannelType.TCP),
			serialization: "raw",
		});

		this._tcp.on("open", () => {
			this.register(this._tcp);
			this.initUDP();
		});

		this._tcp.on("error", (error) => {
			console.error("TCP: " + error);
		});

		this._tcp.on("close", () => {
			console.error("TCP closed!");

			this.unregister(this._tcp);
			this.unregister(this._udp);

			// TODO: reconnect?
			// this.initTCP();
		});
	}

	private initUDP() : void {
		let peer = this.peer();

		this._udp = peer.connect(this.hostName(), {
			reliable: false,
			label: this.channelTypeToLabel(ChannelType.UDP),
			serialization: "raw",
		});

		this._udp.on("open", () => {
			this.register(this._udp);
			this._initialized = true;
		});

		this._udp.on("error", (error) => {
			console.error("UDP: " + error);
		});

		this._udp.on("close", () => {
			console.error("UDP closed!");

			this.unregister(this._udp);

			// TODO: reconnect?
			// this.initUDP();
		});
	}
}