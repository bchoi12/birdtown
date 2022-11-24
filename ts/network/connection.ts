import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, Peer } from 'peerjs'

import { ChannelMap } from 'network/channel_map'
import { Message, MessageType } from 'network/message'

import { isLocalhost } from 'util/common'
import { DoubleMap } from 'util/double_map'

export enum ChannelType {
	UNKNOWN = "UNKNOWN",
	TCP = "TCP",
	UDP = "UDP",
}

type PeerMap = Map<string, ChannelMap>;
type RegisterCallback = (name : string) => void;
type MessageCallback = (msg : Message) => void;

export abstract class Connection {
	private static readonly _validChannels : Set<string> = new Set([
		ChannelType.TCP,
		ChannelType.UDP,
	]);

	protected _peer : Peer;
	protected _peers : Map<string, ChannelMap>;
	protected _nameAndId : DoubleMap<string, number>;
	protected _registerCallbacks : Array<RegisterCallback>;
	protected _messageCallbacks : Map<MessageType, MessageCallback>;

	constructor(name : string) {
		this._peer = new Peer(name, {
			debug: isLocalhost() ? 2 : 0,
			pingInterval: 1000,
		});
		this._peers = new Map();
		this._nameAndId = new DoubleMap();
		this._registerCallbacks = new Array();
		this._messageCallbacks = new Map();

		if (isLocalhost()) {
			console.log("Initializing connection for " + (name.length > 0 ? name : "new client"));
		}
	}

	abstract initialize() : void;

	peer() : Peer { return this._peer; }

	setId(name : string, id : number) {
		this._nameAndId.set(name, id);
	}

	register(connection : DataConnection) {
		if (!Connection._validChannels.has(connection.label)) {
			console.error("Invalid channel type: " + connection.label);
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
			this.handleData(data);
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
		connection.close();
		if (isLocalhost()) {
			console.log("Closed " + connection.label + " connection to " + connection.peer);
		}

		// TODO: remove peer if all connections are closed
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

	send(peer : string|number, type : ChannelType, msg : Message) {
		let name;
		if (typeof(peer) === 'string') {
			name = peer;
		} else {
			if (!this._nameAndId.hasReverse(peer)) {
				console.error("Error: could not find name for id " + peer);
				return;
			}
			name = this._nameAndId.getReverse(peer);
		}

		const channels = this._peers.get(name);
		if (!channels.ready()) {
			console.error("Trying to send data to " + name + " before connection is ready");
			return;
		}

		if (!channels.has(type)) {
			console.error("Missing " + type + " connection for " + name);
			return;
		}

		channels.get(type).send(encode(msg));
	} 

	private async handleData(data : Object) {
		let bytes;
		if (data instanceof Blob) {
			bytes = new Uint8Array(await data.arrayBuffer());
		} else if (data instanceof ArrayBuffer) {
			bytes = new Uint8Array(data);
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
				this._messageCallbacks.get(msg.T)(msg);				
			}
		} else {
			console.error("Missing payload type from message: ", decoded);
		}
	}
}