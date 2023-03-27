import { Peer, DataConnection } from 'peerjs'

import { MessageType, Payload } from 'network/api'
import { Netcode, ChannelType } from 'network/netcode'

import { ui } from 'ui'

import { defined, isLocalhost } from 'util/common'

export class Client extends Netcode {

	private _tcp : DataConnection;
	private _udp : DataConnection;

	constructor(hostName : string, displayName : string) {
		super("", hostName, displayName);
	}

	override isHost() : boolean { return false; }

	override ready() : boolean { return this.initialized() && this._tcp.open && this._udp.open; }
	override initialize() : void {
		super.initialize();

		let peer = this.peer();
		peer.on("open", () => {
			if (isLocalhost()) {
				console.log("Opened client connection for " + peer.id);
			}

			this.registerCallbacks();
			this._pinger.initializeForClient(this, this.hostName());
			this.initTCP();
		});

		peer.on("disconnected", () => {
			peer.reconnect();
		});
	}

	override sendChat(message : string) : void {
		if (message.length <= 0) {
			return;
		}

		this.send(this.hostName(), ChannelType.TCP, {
			T: MessageType.CHAT,
			D: message,
		});
	}

	override setVoiceEnabled(enabled : boolean) : void {
		if (this._voiceEnabled === enabled) {
			return;
		}

		const sent = this.send(this.hostName(), ChannelType.TCP, {
			T: MessageType.VOICE,
			D: enabled,
		});

		if (sent) {
			this._voiceEnabled = enabled;
		}
	}

	private registerCallbacks() : void {
		this.addMessageCallback(MessageType.CHAT, (payload : Payload) => {
			ui.chat(<string>payload.msg.D);
		});

		this.addMessageCallback(MessageType.VOICE_MAP, (payload : Payload) => {
			if (!this._voiceEnabled) { return; }

			const clients = new Map<number, string>();
			Object.entries(payload.msg.D).forEach(([gameId, name] : [string, string]) => {
				clients.set(Number(gameId), name);
			});
			this.callAll(clients);
		});
	}

	private initTCP() : void {
		let peer = this.peer();

		this._tcp = peer.connect(this.hostName(), {
			metadata: {
				name: this.displayName(),
			},
			reliable: true,
			label: ChannelType.TCP,
			serialization: "none",
		});

		this._tcp.on("open", () => {
			this.register(this._tcp);
			this.initUDP();
		});

		this._tcp.on("error", (error) => {
			console.error("TCP: " + error);
		});

		this._tcp.on("close", () => {
			console.error("TCP closed! Reconnecting...");

			this.unregister(this._tcp);

			if (defined(this._udp)) {
				this.unregister(this._udp);
			}

			// TODO: only call if peer connection is still valid
			this.initTCP();
		});
	}

	private initUDP() : void {
		let peer = this.peer();

		this._udp = peer.connect(this.hostName(), {
			reliable: false,
			label: ChannelType.UDP,
			serialization: "none",
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

			// TODO: only call this if the TCP connection is still valid
			this.initUDP();
		});
	}
}