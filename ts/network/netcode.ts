import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, Peer } from 'peerjs'

import { ChannelMap } from 'network/channel_map'
import { IncomingMessage, Message, MessageType } from 'network/message'
import { Connection } from 'network/connection'
import { Pinger } from 'network/pinger'

import { options } from 'options'

import { Buffer } from 'util/buffer'
import { isLocalhost } from 'util/common'

export enum ChannelType {
	UNKNOWN = "UNKNOWN",
	TCP = "TCP",
	UDP = "UDP",
}

type PeerMap = Map<string, ChannelMap>;
type RegisterCallback = (name : string) => void;
type MessageCallback = (incoming : IncomingMessage) => void;

export abstract class Netcode {
	private static readonly _validChannels : Set<string> = new Set([
		ChannelType.TCP,
		ChannelType.UDP,
	]);

	protected _displayName : string;
	protected _hostName : string;
	protected _gameId : number;

	protected _connections : Map<string, Connection>;
	protected _pinger : Pinger;

	protected _registerBuffer : Buffer<string>;
	protected _registerCallbacks : Array<RegisterCallback>;

	protected _messageBuffer : Buffer<IncomingMessage>;
	protected _messageCallbacks : Map<MessageType, MessageCallback>;

	protected _peer : Peer;

	constructor(displayName : string, hostName : string) {
		this._displayName = displayName;
		this._hostName = hostName;
		this._gameId = 0;

		this._connections = new Map();
		this._pinger = new Pinger();

		this._registerBuffer = new Buffer();
		this._registerCallbacks = new Array();
		this._messageBuffer = new Buffer();
		this._messageCallbacks = new Map();
	}

	abstract isHost() : boolean;
	abstract initialize() : void;
	abstract initialized() : boolean;
	abstract ready() : boolean;

	abstract sendChat(message : string) : void;
	abstract receiveChat(from : string, message : string) : void;

	name() : string { return this._peer.id; }
	displayName() : string { return this.hasGameId() ? (this._displayName + " #" + this.gameId()) : this._displayName; }
	hostName() : string { return this._hostName; }
	hasGameId() : boolean { return this._gameId > 0; }
	setGameId(id : number) { this._gameId = id; }
	gameId() : number { return this._gameId; }

	peer() : Peer { return this._peer; }
	ping() : number { return this._pinger.ping(); }
	connections() : Map<string, Connection> { return this._connections; }
	getConnection(name : string) : Connection { return this._connections.get(name); }

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

	postUpdate() : void {

	}

	register(connection : DataConnection) {
		if (!Netcode._validChannels.has(connection.label)) {
			console.error("Error: invalid channel type: " + connection.label);
			return;
		}
		const channelType = <ChannelType>connection.label;
		if (!connection.open) {
			console.error("Warning: registering unopen " + channelType + " channel for " + connection.peer);
		}

		if (!this._connections.has(connection.peer)) {
			let wrapper = new Connection();
			if (connection.metadata) {
				const meta = connection.metadata;

				if (meta.name) {
					wrapper.setDisplayName(meta.name);
				}
			}
			this._connections.set(connection.peer, wrapper);
		}

		let channels = this._connections.get(connection.peer).channels();
		channels.register(channelType, connection);

		connection.on("data", (data : Object) => {
			this.handleData(connection.peer, data);
		});

		connection.on("close", () => {
			channels.delete(channelType);
		});

		connection.on("error", (error) => {
			console.error(error);
		});

		if (channels.ready()) {
			this._registerBuffer.push(connection.peer);
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

	disconnect(name : string) : void {
		if (this._connections.has(name)) {
			this._connections.get(name).disconnect();
		}
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
				const incoming = {
					name: name,
					id: connection.hasGameId() ? connection.gameId() : 0,
					msg: msg,
				};
				if (msg.T === MessageType.GAME) {
					this._messageBuffer.push(incoming);
				} else {
					this._messageCallbacks.get(incoming.msg.T)(incoming);
				}
			}
		} else {
			console.error("Missing payload type from message: ", decoded);
		}
	}
}