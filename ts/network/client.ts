import { DataConnection } from 'peerjs'

import { Connection } from 'network/connection'
import { ChannelType } from 'network/connection'

import { defined, isLocalhost } from 'util/common'

export class Client extends Connection {

	private _hostName : string;

	private _tcp : DataConnection;
	private _udp : DataConnection;

	constructor(name : string, hostName : string) {
		super(name);

		this._hostName = hostName;
	}

	initialize() : void {
		let self = this.self();
		self.on("open", () => {
			if (isLocalhost()) {
				console.log("Opened client connection for " + self.id);
			}

			this._pinger.initializeForClient(this, this.hostName());
			this.initTCP();
		});
	}

	hostName() : string { return this._hostName; }

	private initTCP() : void {
		let self = this.self();

		this._tcp = self.connect(this._hostName, {
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
			this.unregister(this._udp);

			// TODO: only call if peer connection is still valid
			this.initTCP();
		});
	}

	private initUDP() : void {
		let peer = this.self();

		this._udp = peer.connect(this._hostName, {
			reliable: false,
			label: ChannelType.UDP,
			serialization: "none",
		});

		this._udp.on("open", () => {
			this.register(this._udp);
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