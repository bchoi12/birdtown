import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, MediaConnection, Peer } from 'peerjs'

import { ChannelType } from 'network/api'
import { ChannelMap } from 'network/channel_map'
import { NetworkMessageType } from 'message/api'
import { NetworkMessage } from 'message/network_message'
import { Connection } from 'network/connection'
import { Pinger } from 'network/pinger'

import { settings } from 'settings'

import { ui } from 'ui'

import { Buffer } from 'util/buffer'
import { isLocalhost } from 'util/common'
import { DoubleMap } from 'util/double_map'

type PeerMap = Map<string, ChannelMap>;
type RegisterCallback = (connection : Connection) => void;
type MessageCallback = (message : NetworkMessage) => void;

export abstract class Netcode {
	private static readonly _validChannels : DoubleMap<ChannelType, string> = DoubleMap.fromEntries([
		[ChannelType.TCP, "TCP"],
		[ChannelType.UDP, "UDP"],
	]);
	private static readonly _mediaOptions = {
		audio: true,
	    video: false,
    };

	protected _displayName : string;
	protected _hostName : string;
	protected _clientId : number;
	protected _initialized : boolean;
	protected _peer : Peer;

	protected _connections : Map<string, Connection>;
	protected _pinger : Pinger;

	protected _registerBuffer : Buffer<Connection>;
	protected _registerCallbacks : Array<RegisterCallback>;

	protected _messageBuffer : Buffer<NetworkMessage>;
	protected _messageCallbacks : Map<NetworkMessageType, MessageCallback>;

	protected _mediaConnections : Map<number, MediaConnection>;
	protected _micEnabled : boolean;
	protected _voiceEnabled : boolean;

	constructor(name : string, hostName : string, displayName : string) {
		this._displayName = displayName;
		this._hostName = hostName;
		this._clientId = 0;
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

		this._mediaConnections = new Map();
		this._micEnabled = false;
		this._voiceEnabled = false;
	}

	initialize() : void {
		this._peer.on("call", (incoming : MediaConnection) => {
			if (!this._voiceEnabled) {
				return;
			}
			if (!incoming.metadata || incoming.metadata.clientId <= 0) {
				console.log("Error: incoming media connection missing metadata or clientId", incoming);
				return;
			}

			this.queryMic((stream : MediaStream) => {
				incoming.answer(stream);
				this.addMediaConnection(incoming.metadata.clientId, incoming);

				if (isLocalhost()) {
					console.log("Answered incoming call", incoming);
				}
			}, (e) => {
				ui.chat("Failed to answer incoming call");
			});
		});
	}
	initialized() : boolean { return this._initialized; }

	abstract ready() : boolean;
	abstract isHost() : boolean;

	abstract setVoiceEnabled(enabled : boolean) : boolean;
	abstract sendChat(message : string) : void;

	name() : string { return this._peer.id; }
	displayName() : string { return this.hasClientId() ? (this._displayName + " #" + this.clientId()) : this._displayName; }
	hostName() : string { return this._hostName; }
	hasClientId() : boolean { return this._clientId > 0; }
	setClientId(id : number) { this._clientId = id; }
	clientId() : number { return this._clientId; }
	toggleVoice() : boolean { return this.setVoiceEnabled(!this._voiceEnabled); }
	micEnabled() : boolean { return this._micEnabled; }
	voiceEnabled() : boolean { return this._voiceEnabled; }

	peer() : Peer { return this._peer; }
	ping() : number { return this._pinger.ping(); }

	channelTypeToLabel(type : ChannelType) : string { return Netcode._validChannels.get(type); }
	isLabelValid(label : string) : boolean { return Netcode._validChannels.hasReverse(label); }
	labelToChannelType(label : string) : ChannelType { return Netcode._validChannels.getReverse(label); }

	// TODO: deprecate, replace with stats()
	connections() : Map<string, Connection> { return this._connections; }
	getOrAddConnection(name : string) : Connection {
		if (this.hasConnection(name)) {
			return this.getConnection(name);
		}

		let connection = new Connection(name);
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
			voiceMap.set(this.clientId(), this.name());
		}
		this._connections.forEach((connection : Connection, name : string) => {
			if (!connection.hasClientId() || !connection.voiceEnabled()) {
				return;
			}

			voiceMap.set(connection.clientId(), name);
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
			if (this._messageCallbacks.has(incoming.type())) {
				this._messageCallbacks.get(incoming.type())(incoming);
			}
		}
		this._messageBuffer.clear();
	}

	postUpdate() : void {}

	register(dataConnection : DataConnection) {
		if (!this.isLabelValid(dataConnection.label)) {
			console.error("Error: invalid channel type: " + dataConnection.label);
			return;
		}
		const channelType = this.labelToChannelType(dataConnection.label);
		if (!dataConnection.open) {
			console.error("Warning: registering unopen " + channelType + " channel for " + dataConnection.peer);
		}

		// TODO: not sure why, but need to keep getOrAdd instead of add
		let connection = this.getOrAddConnection(dataConnection.peer);
		if (dataConnection.metadata && dataConnection.metadata.name) {
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
			this._registerBuffer.push(connection);
		}
	}

	unregister(connection : DataConnection) {
		let channels = this._connections.get(connection.peer).channels();
		const channelType = this.labelToChannelType(connection.label);

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

	addMessageCallback(type : NetworkMessageType, cb : MessageCallback) {
		if (this._messageCallbacks.has(type)) {
			console.error("Warning: overwriting callback for message type " + type);
		}
		this._messageCallbacks.set(type, cb);
	}

	broadcast(type : ChannelType, msg : NetworkMessage) : void {
		this._connections.forEach((outgoing, name) => {
			if (!outgoing.channels().ready()) {
				return;
			}

			this.send(name, type, msg);
		});
	}

	send(name : string, type : ChannelType, msg : NetworkMessage) : boolean {
		msg.setName(name);
		if (!msg.valid()) {
			console.error("Error: attempting to send invalid message", msg);
			return false;
		}

		if (!this._connections.has(name)) {
			console.error("Error: trying to send message to missing connection", name, msg);
			return false;
		}

		if (!this._connections.get(name).connected()) {
			return false;
		}

		const channels = this._connections.get(name).channels();
		if (!channels.ready() || !channels.has(type)) {
			return false;
		}

		if (isLocalhost() && settings.debugDelay > 0) {
			setTimeout(() => {
				channels.send(type, encode(msg.toObject()));
			}, settings.debugDelay);
		} else {
			channels.send(type, encode(msg.toObject()));
		}
		return true;
	}

	callAll(clients : Map<number, string>) : void {
		const callFn = () => {
			clients.delete(this.clientId());
			clients.forEach((name : string, clientId : number) => {
				this.queryMic((stream : MediaStream) => {
					this.call(name, clientId, stream);
					if (isLocalhost()) {
						console.log("Calling", name, clientId);
					}
				}, (e) => {
					ui.chat("Failed to call peer: " + e);
				});
			});
		}

		if (!this._micEnabled) {
			this.queryMic((stream : MediaStream) => {
				stream = null;
				callFn();
			}, (e) => {
				ui.chat("Failed to get microphone permissions: " + e);
			});
		} else {
			callFn();
		}
	}

	protected queryMic(successCb : (stream : MediaStream) => void, failureCb : (e) => void) : void {
		navigator.mediaDevices.getUserMedia(Netcode._mediaOptions).then((stream : MediaStream) => {
			this._micEnabled = true;
			successCb(stream);
		}).catch((e) => {
			failureCb(e);
		});
	}

	protected call(name : string, clientId : number, stream : MediaStream) : void {
		if (name === this.name()) {
			return;
		}

      	const outgoing = this._peer.call(name, stream, {
      		metadata: {
      			clientId: this.clientId(),
      		},
      	});
      	this.addMediaConnection(clientId, outgoing);
	}

	protected addMediaConnection(clientId : number, mc : MediaConnection) {
		if (this._mediaConnections.has(clientId)) {
			console.error("Error: skipping adding duplicate MediaConnection for", clientId);
			return;
		}

      	mc.on("stream", (stream : MediaStream) => {
      		ui.addStream(clientId, stream);
      	});
      	mc.on("close", () => {
      		ui.removeStream(clientId);
      		this._mediaConnections.delete(clientId);
      	});
      	mc.on("error", (e) => {
      		mc.close();
      	});
		this._mediaConnections.set(clientId, mc);
	}

	protected closeMediaConnection(clientId : number) : void {
		this._mediaConnections.get(clientId).close();
		this._mediaConnections.delete(clientId);
		ui.removeStream(clientId);
	}
	protected closeMediaConnections() {
		this._mediaConnections.forEach((mc : MediaConnection, clientId : number) => {
			mc.close();
		});

		ui.removeStreams();
		this._mediaConnections.clear();
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
			console.error("Error: unknown data type: " + (typeof data));
			return;
		}

		if (bytes.length === 0) {
			console.error("Error: decoded empty payload");
			return;
		}

		if (!this._connections.has(name)) {
			console.error("Error: received message from unknown source", name);
			return;
		}

		let msg = new NetworkMessage(NetworkMessageType.UNKNOWN);
		msg.parseObject(decode(bytes));

		const connection = this._connections.get(name);
		msg.setName(name);

		if (!msg.valid()) {
			console.error("Error: received invalid message over network", msg);
			return;
		}

		if (this._messageCallbacks.has(msg.type())) {
			if (msg.type() === NetworkMessageType.GAME) {
				this._messageBuffer.push(msg);
			} else {
				this._messageCallbacks.get(msg.type())(msg);
			}
		}

	}
}