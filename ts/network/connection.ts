import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, Peer } from 'peerjs'

import { ChannelMap } from 'network/channel_map'
import { Message, MessageType } from 'network/message'

import { isDev } from 'util/common'

export enum ChannelType {
	UNKNOWN = "UNKNOWN",
	TCP = "TCP",
	UDP = "UDP",
}

type MessageHandler = (msg : Message) => void;

export abstract class Connection {
	private static readonly _validChannels : Set<string> = new Set([
		ChannelType.TCP,
		ChannelType.UDP,
	]);

	protected _peer : Peer;
	protected _peers : Map<string, ChannelMap>;
	protected _callbacks : Map<MessageType, MessageHandler>;

	constructor(name : string) {
		this._peer = new Peer(name, {
			debug: isDev() ? 2 : 0,
			pingInterval: 1000,
		});
		this._peers = new Map<string, ChannelMap>();
		this._callbacks = new Map<MessageType, MessageHandler>();

		if (isDev()) {
			console.log("Initializing connection for " + name);
		}
	}

	peer() : Peer { return this._peer; }

	register(connection : DataConnection) {
		if (!Connection._validChannels.has(connection.label)) {
			console.error("Invalid channel type: " + connection.label);
			return;
		}

		if (!this._peers.has(connection.peer)) {
			this._peers.set(connection.peer, new ChannelMap());
		}

		let channels = this._peers.get(connection.peer);
		channels.register(connection);

		connection.on("data", (data : Object) => {
			this.handleData(data);
		});

    	if (isDev()) {
    		console.log("New " + connection.label + " connection to " + connection.peer)
    	}
	}

	unregister(connection : DataConnection) {
		connection.close();
		this._peers.delete(connection.peer);

		if (isDev()) {
			console.log("Deleted " + connection.label + " connection to " + connection.peer);
		}
	}

	addCallback(type : MessageType, cb : MessageHandler) {
		if (this._callbacks.has(type)) {
			console.error("Warning: overwriting callback for message type " + type);
		}
		this._callbacks.set(type, cb);
	}

	send(type : ChannelType, msg : Message) : void {
		this._peers.forEach((channels, name) => {
			if (!channels.has(type)) {
				console.error("Missing " + type + " connection for " + name);
				return;
			}

			channels.get(type).send(encode(msg));
		});
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
			if (this._callbacks.has(msg.T)) {
				this._callbacks.get(msg.T)(msg);				
			}
		} else {
			console.error("Missing payload type from message: " + decoded);
		}
	}
}