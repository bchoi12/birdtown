import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, MediaConnection, Peer } from 'peerjs'

import { game } from 'game'

import { MediaGlobals } from 'global/media_globals'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { ChannelType, ChannelStat } from 'network/api'
import { ChannelMap } from 'network/channel_map'
import { Connection } from 'network/connection'
import { Pinger } from 'network/pinger'

import { settings } from 'settings'

import { ui } from 'ui'
import { ChatType, StatusType } from 'ui/api'

import { Buffer } from 'util/buffer'
import { defined, isLocalhost } from 'util/common'
import { DoubleMap } from 'util/double_map'
import { Optional } from 'util/optional'

type PeerMap = Map<string, ChannelMap>;
type RegisterCallback = (connection : Connection) => void;
type MessageCallback<T extends NetworkMessage> = (message : T) => void;

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

	protected _room : string;
	protected _clientId : number;
	protected _initialized : boolean;
	protected _peer : Peer;
	protected _dataFormat : DataFormat;

	protected _connections : Map<string, Connection>;
	protected _pinger : Pinger;

	protected _registerBuffer : Buffer<Connection>;
	protected _registerCallbacks : Array<RegisterCallback>;

	protected _messageBuffer : Buffer<NetworkMessage>;
	protected _messageCallbacks : Map<NetworkMessageType, MessageCallback<NetworkMessage>>;

	protected _mediaConnections : Map<number, MediaConnection>;
	protected _voiceEnabled : boolean;
	// TODO: delete?
	protected _audioContext : Optional<AudioContext>;

	constructor(room : string) {
		this._room = room.toUpperCase();
		this._clientId = 0;
		this._initialized = false;
		this._dataFormat = DataFormat.UNKNOWN;
		this._peer = null;

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

	initialize(onSuccess : () => void, onError: () => void) : void {
		this._peer = new Peer(this.isHost() ? this.hostName() : "", {
			debug: 2,
			pingInterval: 5000,
		});

		this.addMessageCallback(NetworkMessageType.GAME, (msg : NetworkMessage) => {
			game.runner().importData(msg.getData(), msg.getSeqNum());
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
				if (game.tablets().hasTablet(incoming.metadata.clientId)) {
					const name = game.tablet(incoming.metadata.clientId).displayName();
					ui.chat(ChatType.ERROR, "Failed to answer call from " + name);
				}
			});
		});
	}
	initialized() : boolean { return this._initialized; }

	abstract ready() : boolean;
	abstract isHost() : boolean;
	abstract setVoiceEnabled(enabled : boolean) : void;
	abstract sendChat(clientId : number, message : string) : void;

	id() : string { return this._peer.id; }
	room() : string { return this._room; }
	hostName() : string { return "birdtown-" + this._room; }
	hasClientId() : boolean { return this._clientId > 0; }
	setClientId(id : number) { this._clientId = id; }
	clientId() : number { return this._clientId; }
	voiceEnabled() : boolean { return this._voiceEnabled; }

	peer() : Peer { return this._peer; }
	ping() : number { return this._pinger.ping(); }
	pingLoss() : number { return this._pinger.pingLoss(); }

	channelTypeToLabel(type : ChannelType) : string { return Netcode._validChannels.get(type); }
	isLabelValid(label : string) : boolean { return Netcode._validChannels.hasReverse(label); }
	labelToChannelType(label : string) : ChannelType { return Netcode._validChannels.getReverse(label); }

	stats() : Map<ChannelType, Map<ChannelStat, number>> {

		let tcpStats = new Map<ChannelStat, number>();
		let udpStats = new Map<ChannelStat, number>();

		const channelStats = new Map<ChannelType, Map<ChannelStat, number>>([
			[ChannelType.TCP, tcpStats],
			[ChannelType.UDP, udpStats],
		]);

		let tcpPackets = 0, udpPackets = 0, tcpBytes = 0, udpBytes = 0;
		this._connections.forEach((connection : Connection) => {
			const channels = connection.channels();
			tcpPackets += channels.flushStat(ChannelType.TCP, ChannelStat.PACKETS);
			udpPackets += channels.flushStat(ChannelType.UDP, ChannelStat.PACKETS);
			tcpBytes += channels.flushStat(ChannelType.TCP, ChannelStat.BYTES);
			udpBytes += channels.flushStat(ChannelType.UDP, ChannelStat.BYTES);
		});

		tcpStats.set(ChannelStat.PACKETS, tcpPackets)
		udpStats.set(ChannelStat.PACKETS, udpPackets)
		tcpStats.set(ChannelStat.BYTES, tcpBytes)
		udpStats.set(ChannelStat.BYTES, udpBytes)
		return channelStats;
	}
	getOrAddConnection(id : string) : Connection {
		if (this.hasConnection(id)) {
			return this.connection(id);
		}

		let connection = new Connection(id);
		this._connections.set(id, connection);
		return connection;
	}
	hasConnection(id : string) : boolean { return this._connections.has(id); }
	connection(id : string) : Connection { return this._connections.get(id); }
	getVoiceMap() : Map<number, string> {
		if (!this.isHost()) {
			console.error("Error: client queried voice map");
			return new Map();
		}

		const voiceMap = new Map<number, string>();
		if (this._voiceEnabled) {
			voiceMap.set(this.clientId(), this.id());
		}
		this._connections.forEach((connection : Connection, id : string) => {
			if (!connection.hasClientId() || !connection.voiceEnabled()) {
				return;
			}

			voiceMap.set(connection.clientId(), id);
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

		this._connections.forEach((connection : Connection, id : string) => {
			if (!connection.connected()) {
				return;
			}

			if (this._pinger.millisSincePing(id) >= Netcode._pingTimeoutMillis) {
				console.error("Connection to " + id + " timed out");
				this.disconnect(id);

				if (!this.isHost()) {
					ui.showStatus(StatusType.DISCONNECTED);
				}
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
			console.error("Error: tried to register unopen " + ChannelType[channelType] + " channel for " + dataConnection.peer);
			return;
		}

		// TODO: not sure why, but need to keep getOrAdd instead of add
		let connection = this.getOrAddConnection(dataConnection.peer);
		let channels = connection.channels();
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

	addMessageCallback<T extends NetworkMessage>(type : NetworkMessageType, cb : MessageCallback<T>) {
		if (this._messageCallbacks.has(type)) {
			console.error("Warning: overwriting callback for %s message", NetworkMessageType[type]);
		}
		this._messageCallbacks.set(type, cb);
	}

	broadcast(type : ChannelType, msg : NetworkMessage) : void {
		this._connections.forEach((outgoing, id) => {
			if (!outgoing.channels().ready()) {
				return;
			}

			this.send(id, type, msg);
		});
	}

	send(id : string, type : ChannelType, msg : NetworkMessage) : boolean {
		msg.setName(id);
		if (!msg.valid()) {
			console.error("Error: attempting to send invalid message", msg);
			return false;
		}

		if (!this._connections.has(id)) {
			console.error("Error: trying to send message to missing connection", id, msg);
			return false;
		}

		if (!this._connections.get(id).connected()) {
			return false;
		}

		const channels = this._connections.get(id).channels();
		if (!channels.ready() || !channels.has(type)) {
			return false;
		}

		// For debugging - fail to send UDP packet.
		if (type === ChannelType.UDP && settings.sendSuccessRate() < Math.random()) {
			return true;
		}

		const payload = encode(msg.exportObject());
		let delay = settings.delay();
		if (Date.now() % 3000 <= 500) {
			delay += settings.jitter() * (0.5 + 0.5 * Math.random());
		}
		if (delay > 0) {
			setTimeout(() => {
				channels.send(type, payload);
			}, delay);
		} else {
			channels.send(type, payload);
		}
		return true;
	}

	callAll(clients : Map<number, string>, onSuccess : () => void, onError : () => void) : void {
		const callFn = () => {
			clients.delete(this.clientId());
			clients.forEach((id : string, clientId : number) => {
				this.queryMic((stream : MediaStream) => {
					this.call(id, clientId, stream);
					if (isLocalhost()) {
						console.log("Calling", id, clientId);
					}
				}, (e) => {
					if (game.tablets().hasTablet(clientId)) {
						const name = game.tablet(clientId).displayName();
						ui.chat(ChatType.ERROR, "Failed to call " + name + "!");
					}

					if (isLocalhost()) {
						console.error(e);
					}
				});
			});
		}

		if (!this._audioContext.has()) {
			this.queryMic((stream : MediaStream) => {
				stream = null;
				callFn();
				onSuccess();
			}, (e) => {
				console.error(e);
				onError();
			});
		} else {
			callFn();
			onSuccess();
		}
	}

	protected queryMic(onSuccess : (stream : MediaStream) => void, failureCb : (e) => void) : void {
		navigator.mediaDevices.getUserMedia(MediaGlobals.mediaConstraints).then((stream : MediaStream) => {
			this._audioContext.set(new AudioContext());
			onSuccess(stream);
		}).catch((e) => {
			failureCb(e);
		});
	}

	protected call(id : string, clientId : number, stream : MediaStream) : void {
		if (id === this.id()) {
			return;
		}

      	const outgoing = this._peer.call(id, stream, {
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

	disconnect(id : string) : void {
		if (this.hasConnection(id)) {
			let connection = this.connection(id);
			connection.disconnect();

			if (connection.hasClientId()) {
				let msg = new GameMessage(GameMessageType.CLIENT_DISCONNECT);
				msg.setClientId(connection.clientId());
				game.handleMessage(msg);
				ui.handleMessage(msg);
			}
		}
	}

	kick(clientId : number) : void {
		this._connections.forEach((connection : Connection) => {
			if (clientId === connection.clientId()) {
				this.disconnect(connection.id());
			}
		});
	}

	private async handleData(id : string, data : unknown) : Promise<void> {
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

		if (!this._connections.has(id)) {
			console.error("Error: received message from unknown source", id);
			return;
		}

		let msg = new NetworkMessage(NetworkMessageType.UNKNOWN);
		msg.parseObject(<MessageObject>decode(bytes));

		const connection = this._connections.get(id);
		msg.setName(id);

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