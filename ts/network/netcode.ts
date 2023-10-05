import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, MediaConnection, Peer } from 'peerjs'

import { game } from 'game'

import { MediaGlobals } from 'global/media_globals'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { NetworkMessage, NetworkMessageType, NetworkProp } from 'message/network_message'

import { ChannelType } from 'network/api'
import { ChannelMap } from 'network/channel_map'
import { Connection } from 'network/connection'
import { Pinger } from 'network/pinger'

import { settings } from 'settings'

import { ui } from 'ui'

import { Buffer } from 'util/buffer'
import { defined, isLocalhost } from 'util/common'
import { DoubleMap } from 'util/double_map'
import { Optional } from 'util/optional'

type PeerMap = Map<string, ChannelMap>;
type RegisterCallback = (connection : Connection) => void;
type MessageCallback = (message : NetworkMessage) => void;

enum DataFormat {
	UNKNOWN,
	ARRAY_BUFFER,
	BLOB,
}

export abstract class Netcode {

	private static readonly _pingTimeoutMillis = 10000;

	private static readonly _validChannels : DoubleMap<ChannelType, string> = DoubleMap.fromEntries([
		[ChannelType.TCP, "TCP"],
		[ChannelType.UDP, "UDP"],
	]);

	protected _displayName : string;
	protected _hostName : string;
	protected _clientId : number;
	protected _initialized : boolean;
	protected _peer : Peer;
	protected _dataFormat : DataFormat;

	protected _connections : Map<string, Connection>;
	protected _pinger : Pinger;

	protected _registerBuffer : Buffer<Connection>;
	protected _registerCallbacks : Array<RegisterCallback>;

	protected _messageBuffer : Buffer<NetworkMessage>;
	protected _messageCallbacks : Map<NetworkMessageType, MessageCallback>;

	protected _mediaConnections : Map<number, MediaConnection>;
	protected _voiceEnabled : boolean;
	// TODO: delete?
	protected _audioContext : Optional<AudioContext>;

	constructor(name : string, hostName : string, displayName : string) {
		this._displayName = displayName;
		this._hostName = hostName;
		this._clientId = 0;
		this._initialized = false;
		this._dataFormat = DataFormat.UNKNOWN;
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
		this._voiceEnabled = false;
		this._audioContext = new Optional();
	}

	initialize() : void {
		this.addMessageCallback(NetworkMessageType.GAME, (msg : NetworkMessage) => {
			game.runner().importData(msg.get(NetworkProp.DATA), msg.get<number>(NetworkProp.SEQ_NUM));
		});

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
	voiceEnabled() : boolean { return this._voiceEnabled; }

	peer() : Peer { return this._peer; }
	ping() : number { return this._pinger.ping(); }
	pingLoss() : number { return this._pinger.pingLoss(); }

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

	preStep() : void {
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

			if (this._pinger.millisSincePing(name) >= Netcode._pingTimeoutMillis) {
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

		dataConnection.on("data", (data) => {
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

	unregister(connection : DataConnection) : void {
		if (!defined(connection)) { return; }

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

		if (settings.debugSendFailure > 0 && type === ChannelType.UDP && settings.debugSendFailure > Math.random()) {
			return true;
		}

		const payload = encode(msg.exportObject());
		const second = (Date.now() / 1000) % 10;
		const delay = Math.max(0, settings.debugDelay + Math.sin(Math.PI / 10 * second) * settings.debugJitter);
		if (delay > 0) {
			setTimeout(() => {
				channels.send(type, payload);
			}, delay);
		} else {
			channels.send(type, payload);
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

		if (!this._audioContext.has()) {
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
		navigator.mediaDevices.getUserMedia(MediaGlobals.mediaConstraints).then((stream : MediaStream) => {
			this._audioContext.set(new AudioContext());
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

	protected addMediaConnection(clientId : number, mediaConnection : MediaConnection) {
		if (this._mediaConnections.has(clientId)) {
			console.error("Error: skipping adding duplicate MediaConnection for", clientId);
			return;
		}

      	mediaConnection.on("stream", (stream : MediaStream) => {
      		ui.addStream(clientId, stream);
      	});
      	mediaConnection.on("close", () => {
      		ui.removeStream(clientId);
      		this._mediaConnections.delete(clientId);
      	});
      	mediaConnection.on("error", (e) => {
      		console.error(e)
      		mediaConnection.close();
      	});
		this._mediaConnections.set(clientId, mediaConnection);
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
		if (this.hasConnection(name)) {
			let connection = this.getConnection(name);
			connection.disconnect();

			if (connection.hasClientId()) {
				let msg = new GameMessage(GameMessageType.CLIENT_DISCONNECT);
				msg.set<number>(GameProp.CLIENT_ID, connection.clientId());
				game.handleMessage(msg);
			}
		}
	}

	private async handleData(name : string, data : unknown) : Promise<void> {
		let bytes;

		switch (this._dataFormat) {
		case DataFormat.UNKNOWN:
			if (data instanceof ArrayBuffer) {
				bytes = new Uint8Array(data);
				this._dataFormat = DataFormat.ARRAY_BUFFER;
			} else if (data instanceof Blob) {
				bytes = new Uint8Array(await data.arrayBuffer());
				this._dataFormat = DataFormat.BLOB;
			} else {
				console.error("Error: unknown data type: " + (typeof data));
				return;
			}
			break;
		case DataFormat.ARRAY_BUFFER:
			bytes = new Uint8Array(<ArrayBuffer>data);
			break;
		case DataFormat.BLOB:
			bytes = new Uint8Array(await (<Blob>data).arrayBuffer());
			break;
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
		msg.parseObject(<MessageObject>decode(bytes));

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