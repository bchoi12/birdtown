import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, MediaConnection, Peer } from 'peerjs'

import { ChannelMap } from 'network/channel_map'
import { Payload, Message, MessageType } from 'network/api'
import { Connection } from 'network/connection'
import { Pinger } from 'network/pinger'

import { options } from 'options'

import { ui } from 'ui'

import { Buffer } from 'util/buffer'
import { isLocalhost } from 'util/common'

export enum ChannelType {
	UNKNOWN = "UNKNOWN",
	TCP = "TCP",
	UDP = "UDP",
}

type PeerMap = Map<string, ChannelMap>;
type RegisterCallback = (name : string) => void;
type MessageCallback = (incoming : Payload) => void;

export abstract class Netcode {
	private static readonly _validChannels : Set<string> = new Set([
		ChannelType.TCP,
		ChannelType.UDP,
	]);

	protected _displayName : string;
	protected _hostName : string;
	protected _gameId : number;
	protected _initialized : boolean;
	protected _peer : Peer;

	protected _connections : Map<string, Connection>;
	protected _pinger : Pinger;

	protected _registerBuffer : Buffer<string>;
	protected _registerCallbacks : Array<RegisterCallback>;

	protected _messageBuffer : Buffer<Payload>;
	protected _messageCallbacks : Map<MessageType, MessageCallback>;

	protected _voiceEnabled : boolean;

	constructor(name : string, hostName : string, displayName : string) {
		this._displayName = displayName;
		this._hostName = hostName;
		this._gameId = 0;
		this._initialized = false;
		this._peer = new Peer(name, {
			debug: 2,
			pingInterval: 5000,
		});

		this._connections = new Map();
		this._pinger = new Pinger();

		this._registerBuffer = new Buffer();
		this._registerCallbacks = new Array();
		this._messageBuffer = new Buffer();
		this._messageCallbacks = new Map();

		this._voiceEnabled = false;
	}

	initialize() : void {
		this._peer.on("call", (incoming : MediaConnection) => {
			// TODO: ignore calls if voice is disabled

			navigator.mediaDevices.getUserMedia({
				audio: true,
			    video: false,
		    }).then((stream) => {
		      	stream.getTracks().forEach((track) => { track.enabled = true; });

				incoming.answer(stream);
				incoming.on("stream", (stream : MediaStream) => {
		      		ui.addStream(this._connections.get(incoming.peer).gameId(), stream);
				});
		    }).catch((e) => {
		    	console.error("Failed to enable voice chat:", e);
		    });
		});
	}
	initialized() : boolean { return this._initialized; }

	abstract ready() : boolean;
	abstract isHost() : boolean;

	abstract setVoiceEnabled(enabled : boolean) : void;
	abstract sendChat(message : string) : void;

	name() : string { return this._peer.id; }
	displayName() : string { return this.hasGameId() ? (this._displayName + " #" + this.gameId()) : this._displayName; }
	hostName() : string { return this._hostName; }
	hasGameId() : boolean { return this._gameId > 0; }
	setGameId(id : number) { this._gameId = id; }
	gameId() : number { return this._gameId; }

	peer() : Peer { return this._peer; }
	ping() : number { return this._pinger.ping(); }
	connections() : Map<string, Connection> { return this._connections; }
	getOrAddConnection(name : string) : Connection {
		if (this.hasConnection(name)) {
			return this.getConnection(name);
		}
		let connection = new Connection();
		this._connections.set(name, connection);
		return connection;
	}
	hasConnection(name : string) : boolean { return this._connections.has(name); }
	getConnection(name : string) : Connection { return this._connections.get(name); }
	getVoiceMap() : Map<number, string> {
		if (!this.isHost()) {
			console.error("Error: client queried voice map");
			return new Map();
		}

		const voiceMap = new Map<number, string>();
		if (this._voiceEnabled) {
			voiceMap.set(this.gameId(), this.name());
		}
		this._connections.forEach((connection : Connection, name : string) => {
			if (!connection.hasGameId() || !connection.voiceEnabled()) {
				return;
			}

			voiceMap.set(connection.gameId(), name);
		});
		return voiceMap;
	}

	preUpdate() : void {
		for (let i = 0; i < this._registerBuffer.size(); ++i) {
			for (let j = 0; j < this._registerCallbacks.length; ++j) {
				this._registerCallbacks[j](this._registerBuffer.get(i));
			}
		}
		this._registerBuffer.clear();

		this._connections.forEach((connection : Connection, name : string) => {
			if (!connection.connected()) {
				return;
			}

			if (this._pinger.timeSincePing(name) >= 10000) {
				console.error("Connection to " + name + " timed out");
				this.disconnect(name);
			}
		});

		for (let i = 0; i < this._messageBuffer.size(); ++i) {
			const incoming = this._messageBuffer.get(i);
			if (this._messageCallbacks.has(incoming.msg.T)) {
				this._messageCallbacks.get(incoming.msg.T)(incoming);
			}
		}
		this._messageBuffer.clear();
	}

	postUpdate() : void {}

	register(dataConnection : DataConnection) {
		if (!Netcode._validChannels.has(dataConnection.label)) {
			console.error("Error: invalid channel type: " + dataConnection.label);
			return;
		}
		const channelType = <ChannelType>dataConnection.label;
		if (!dataConnection.open) {
			console.error("Warning: registering unopen " + channelType + " channel for " + dataConnection.peer);
		}

		if (dataConnection.metadata && dataConnection.metadata.name) {
			let connection = this.getConnection(dataConnection.peer);
		}

		let connection = this.getOrAddConnection(dataConnection.peer);
		if (!connection.hasDisplayName() && dataConnection.metadata && dataConnection.metadata.name) {
			connection.setDisplayName(dataConnection.metadata.name);
		}

		let channels = this._connections.get(dataConnection.peer).channels();
		channels.register(channelType, dataConnection);

		dataConnection.on("data", (data : Object) => {
			this.handleData(dataConnection.peer, data);
		});

		dataConnection.on("close", () => {
			channels.delete(channelType);
		});

		dataConnection.on("error", (error) => {
			console.error(error);
		});

		if (channels.ready()) {
			this._registerBuffer.push(dataConnection.peer);
		}
	}

	unregister(connection : DataConnection) {
		let channels = this._connections.get(connection.peer).channels();
		const channelType = <ChannelType>connection.label;

		if (connection.open) {
			connection.close();
			channels.delete(channelType);
		}

		console.log("Closed " + connection.label + " connection to " + connection.peer);

		if (channels.disconnected()) {
			console.log("Client " + connection.peer + " disconnected.");
			this._connections.delete(connection.peer);
		}
	}

	addRegisterCallback(cb : RegisterCallback) {
		this._registerCallbacks.push(cb);
	}

	addMessageCallback(type : MessageType, cb : MessageCallback) {
		if (this._messageCallbacks.has(type)) {
			console.error("Warning: overwriting callback for message type " + type);
		}
		this._messageCallbacks.set(type, cb);
	}

	broadcast(type : ChannelType, msg : Message) : void {
		this._connections.forEach((outgoing, name) => {
			if (!outgoing.channels().ready()) {
				return;
			}

			this.send(name, type, msg);
		});
	}

	send(name : string, type : ChannelType, msg : Message) : boolean {
		if (!this._connections.has(name) || !this._connections.get(name).connected()) {
			return false;
		}

		const channels = this._connections.get(name).channels();
		if (!channels.ready() || !channels.has(type)) {
			return false;
		}

		if (isLocalhost() && options.debugDelay > 0) {
			setTimeout(() => {
				channels.send(type, encode(msg));
			}, options.debugDelay);
		} else {
			channels.send(type, encode(msg));
		}
		return true;
	}

	call(name : string, gameId : number) : void {
		if (name === this.name()) {
			return;
		}

		navigator.mediaDevices.getUserMedia({
			audio: true,
		    video: false,
	    }).then((stream) => {
	      	stream.getTracks().forEach((track) => { track.enabled = true; });

	      	const outgoing = this._peer.call(name, stream);
	      	outgoing.on("stream", (stream : MediaStream) => {
	      		ui.addStream(gameId, stream);
	      	});
	    }).catch((e) => {
	    	console.error("Failed to enable voice chat:", e);
	    });
	}

	callAll(clients : Map<number, string>) : void {
		console.log("Call", clients);

		if (clients.size === 0) { return; }

		clients.forEach((name : string, gameId : number) => {
			this.call(name, gameId);
		});
	}

	disconnect(name : string) : void {
		if (this._connections.has(name)) {
			this._connections.get(name).disconnect();
		}
	}

	validatePayload(payload : Payload) : boolean {
		if (!this._connections.has(payload.name)) {
			console.error("Error: received payload from unknown source:", payload)
			return false;
		}

		return true;
	}

	private async handleData(name : string, data : Object) {
		let bytes;
		if (data instanceof ArrayBuffer) {
			bytes = new Uint8Array(data);
		} else if (data instanceof Blob) {
			bytes = new Uint8Array(await data.arrayBuffer());
		} else {
			console.error("Unknown data type: " + (typeof data));
			return;
		}

		if (bytes.length === 0) {
			console.error("Decoded empty payload");
			return;
		}

		const decoded : Object = decode(bytes);
		if ('T' in decoded) {
			const msg = <Message>decoded;
			if (this._messageCallbacks.has(msg.T)) {
				const connection = this._connections.get(name);
				const payload = {
					name: name,
					id: connection.hasGameId() ? connection.gameId() : 0,
					msg: msg,
				};

				if (!this.validatePayload(payload)) {
					return;
				}

				if (msg.T === MessageType.GAME) {
					this._messageBuffer.push(payload);
				} else {
					this._messageCallbacks.get(payload.msg.T)(payload);
				}
			}
		} else {
			console.error("Missing payload type from message: ", decoded);
		}
	}
}