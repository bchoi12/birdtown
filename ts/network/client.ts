import { Peer, DataConnection } from 'peerjs'

import { MessageType } from 'network/message'
import { Netcode, ChannelType } from 'network/netcode'

import { ui } from 'ui'

import { defined, isLocalhost } from 'util/common'

export class Client extends Netcode {

	private _initialized : boolean;

	private _tcp : DataConnection;
	private _udp : DataConnection;

	constructor(displayName : string, hostName : string) {
		super(displayName, hostName);

		this._peer = new Peer("", {
			debug: 2,
			pingInterval: 5000,
		});

		this._initialized = false;
	}

	override isHost() : boolean { return false; }

	override initialized() : boolean { return this._initialized; }
	override ready() : boolean { return this.initialized() && this._tcp.open && this._udp.open; }
	override initialize() : void {
		super.initialize();

		let peer = this.peer();
		peer.on("open", () => {
			if (isLocalhost()) {
				console.log("Opened client connection for " + peer.id);
			}

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

	override receiveChat(from : string, message : string) : void {
		if (from !== this._hostName) {
			return;
		}

		ui.chat(message);
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