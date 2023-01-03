import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, Peer } from 'peerjs'

import { ChannelMap } from 'network/channel_map'
import { Message, MessageType } from 'network/message'
import { Pinger } from 'network/pinger'

import { options } from 'options'

import { isLocalhost } from 'util/common'
import { DoubleMap } from 'util/double_map'

export enum ChannelType {
	UNKNOWN = "UNKNOWN",
	TCP = "TCP",
	UDP = "UDP",
}

type PeerMap = Map<string, ChannelMap>;
type RegisterCallback = (name : string) => void;
type MessageCallback = (name : string, msg : Message) => void;

export abstract class Connection {
	private static readonly _validChannels : Set<string> = new Set([
		ChannelType.TCP,
		ChannelType.UDP,
	]);

	protected _peer : Peer;
	protected _peers : Map<string, ChannelMap>;
	protected _nameAndId : DoubleMap<string, number>;
	protected _pinger : Pinger;
	protected _registerCallbacks : Array<RegisterCallback>;
	protected _messageCallbacks : Map<MessageType, MessageCallback>;

	constructor(name : string) {
		this._peer = new Peer(name, {
			debug: 2,
			pingInterval: 1000,
		});
		this._peers = new Map();
		this._nameAndId = new DoubleMap();

		this._pinger = new Pinger();

		this._registerCallbacks = new Array();
		this._messageCallbacks = new Map();

		if (isLocalhost()) {
			console.log("Initializing connection for " + (name.length > 0 ? name : "new client"));
		}
	}

	abstract initialize() : void;

	peer() : Peer { return this._peer; }
	peers() : Map<string, ChannelMap> { return this._peers; }
	ping() : number { return this._pinger.ping(); }

	names() : Set<string> { return this._nameAndId.keys(); }
	ids() : Set<number> { return this._nameAndId.values(); }
	setId(name : string, id : number) {
		this._nameAndId.set(name, id);
	}

	update(seqNum : number) : void {
		this.names().forEach((name : string) => {
			if (this._pinger.timeSincePing(name) >= 10000) {
				console.error("Connection to " + name + " timed out");
				this.close(name);
			}
		});
	}

	register(connection : DataConnection) {
		if (!Connection._validChannels.has(connection.label)) {
			console.error("Error: invalid channel type: " + connection.label);
			return;
		}
		const channelType = <ChannelType>connection.label;
		if (!connection.open) {
			console.error("Warning: registering unopen " + channelType + " channel for " + connection.peer);
		}

		if (!this._peers.has(connection.peer)) {
			this._peers.set(connection.peer, new ChannelMap());
		}

		let channels = this._peers.get(connection.peer);
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
			this._registerCallbacks.forEach((cb) => {
				cb(connection.peer);
			});
		}
	}

	unregister(connection : DataConnection) {
		let channels = this._peers.get(connection.peer);
		const channelType = <ChannelType>connection.label;

		if (connection.open) {
			connection.close();
			channels.delete(channelType);
		}

		console.log("Closed " + connection.label + " connection to " + connection.peer);

		if (channels.disconnected()) {
			console.log("Client " + connection.peer + " disconnected.");
			this._peers.delete(connection.peer);
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
		this._peers.forEach((channels, name) => {
			if (!channels.ready()) {
				return;
			}

			this.send(name, type, msg);
		});
	}

	send(peer : string|number, type : ChannelType, msg : Message) : boolean {
		let name;
		if (typeof(peer) === 'string') {
			name = peer;
		} else {
			if (!this._nameAndId.hasReverse(peer)) {
				console.error("Error: could not find name for id " + peer);
				return false;
			}
			name = this._nameAndId.getReverse(peer);
		}

		if (!this._peers.has(name)) {
			return false;
		}

		const channels = this._peers.get(name);
		if (!channels.ready()) {
			return false;
		}

		if (!channels.has(type)) {
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

	close(peer : string) : void {
		this._peers.get(peer).disconnect();
		this._peers.delete(peer);
		this._nameAndId.delete(peer);
	}

	private async handleData(peer : string, data : Object) {
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
				this._messageCallbacks.get(msg.T)(peer, msg);
			}
		} else {
			console.error("Missing payload type from message: ", decoded);
		}
	}
}