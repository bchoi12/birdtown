import { encode, decode } from '@msgpack/msgpack'
import { DataConnection, MediaConnection, Peer } from 'peerjs'

import { game } from 'game'

import { Flags } from 'global/flags'
import { MediaGlobals } from 'global/media_globals'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { ChannelType, ChannelStat, DisconnectType } from 'network/api'
import { ChannelMap } from 'network/channel_map'
import { Connection } from 'network/connection'
import { ClientOptions } from 'network/client'
import { HostOptions } from 'network/host'
import { Pinger } from 'network/pinger'

import { perch } from 'perch'

import { settings } from 'settings'

import { ui } from 'ui'
import { ChatType, DialogType } from 'ui/api'

import { Buffer } from 'util/buffer'
import { defined } from 'util/common'
import { DoubleMap } from 'util/double_map'
import { Optional } from 'util/optional'

type PeerMap = Map<string, ChannelMap>;
type RegisterCallback = (connection : Connection) => void;
type MessageCallback<T extends NetworkMessage> = (fromId : string, message : T) => void;

enum DataFormat {
	UNKNOWN,
	ARRAY_BUFFER,
	BLOB,
}

export type NetcodeOptions = {
	room : string;
	password : string;
	isHost : boolean;

	hostOptions? : HostOptions;
	clientOptions? : ClientOptions;
}

export abstract class Netcode {

	private static readonly _initializeTimeout = 20000;

	// For peer.js connection
	private static readonly _pingInterval = 30000;

	private static readonly _validChannels : DoubleMap<ChannelType, string> = DoubleMap.fromEntries([
		[ChannelType.TCP, "TCP"],
		[ChannelType.UDP, "UDP"],
	]);

	protected _room : string;
	protected _password : string;
	protected _hostName : string;
	protected _peerName : string;
	protected _clientId : number;
	protected _initialized : boolean;
	protected _initError : boolean;
	protected _peer : Peer;
	protected _dataFormat : DataFormat;

	protected _connections : Map<string, Connection>;
	protected _pinger : Pinger;

	protected _registerBuffer : Buffer<Connection>;
	protected _registerCallbacks : Array<RegisterCallback>;

	protected _messageBuffer : Buffer<[string, NetworkMessage]>;
	protected _messageCallbacks : Map<NetworkMessageType, MessageCallback<NetworkMessage>>;

	protected _mediaConnections : Map<number, MediaConnection>;
	protected _voiceEnabled : boolean;
	// TODO: delete?
	protected _audioContext : Optional<AudioContext>;

	constructor(options : NetcodeOptions) {
		this._room = options.room.toUpperCase();
		this._password = options.password;

		this._hostName = "birdtown-" + this._room;
		this._peerName = this._hostName + "-" + settings.userToken;
		this._clientId = 0;
		this._initialized = false;
		this._initError = false;
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

		this.addMessageCallback(NetworkMessageType.GAME, (fromId : string, msg : NetworkMessage) => {
			game.runner().importData(msg.getData(), msg.getSeqNum());
		});
	}

	async initialize(onSuccess : () => void, onError: () => void) : Promise<void> {
		const peerDebug = Flags.peerDebug.get();
		if (perch.enabled()) {
			console.log(`Using ${perch.url()} with ID`, this.peerName());

			let peerOptions = {
				host: perch.host(),
				path: this.getPerchPath(),
				debug: peerDebug,
				pingInterval: Netcode._pingInterval,
				token: settings.userToken,
				proxied: true,
				port: 443,
				secure: true,

				config: {
					iceServers: [
						{ urls: "stun:stun.l.google.com:19302" },
						{
							urls: [
								"turn:eu-0.turn.peerjs.com:3478",
								"turn:us-0.turn.peerjs.com:3478",
							],
							username: "peerjs",
							credential: "peerjsp",
						},
					],
					sdpSemantics: "unified-plan",
				}
			};

			if (Flags.useLocalPerch.get()) {
				peerOptions.proxied = false;
				peerOptions.port = Flags.localPerchPort.get();
				peerOptions.secure = false;
			}

			await perch.getTurnCredentials((data) => {
				if (!data || !data.iceServers) {
					console.error("Failed to obtain TURN credentials", data);
					return;
				}

				data.iceServers.forEach((iceServer) => {
					peerOptions.config.iceServers.push(iceServer);
				});

				if (Flags.printDebug.get()) {
					console.log("Appended TURN credentials:", peerOptions.config);
				}
			}, () => {
				console.error("Failed to obtain TURN credentials");
			});

			this._peer = new Peer(this.peerName(), peerOptions);
		} else {
			console.log(`Using peerjs server with ID`, this.peerName());
			this._peer = new Peer(this.peerName(), {
				debug: peerDebug,
				pingInterval: Netcode._pingInterval,
			});
		}

		this._initError = false;

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

				if (Flags.printDebug.get()) {
					console.log("Answered incoming call", incoming);
				}
			}, (e) => {
				if (game.tablets().hasTablet(incoming.metadata.clientId)) {
					const name = game.tablet(incoming.metadata.clientId).displayName();
					ui.chat(ChatType.ERROR, "Failed to answer call from " + name);
				}
			});
		});

		setTimeout(() => {
			if (!this.initialized()) {
				this.initError(onError);
			}
		}, Netcode._initializeTimeout);
	}
	initialized() : boolean { return this._initialized; }
	hasInitError() : boolean { return this._initError; }
	initError(onError : () => void) : void {
		if (this._initialized || this._initError) {
			return;
		}

		this._initError = true;

		if (this._peer !== null) {
			this._peer.destroy();
		}
		onError();
	}

	abstract ready() : boolean;
	abstract isHost() : boolean;
	abstract setVoiceEnabled(enabled : boolean) : void;
	abstract sendMessage(msg : NetworkMessage) : void;
	abstract sendChat(type : ChatType, message : string) : void;

	id() : string { return this._peer.id; }
	room() : string { return this._room; }

	private getPerchPath() : string { return `/peer/${this.room()}/${this.password()}/${this.getParams()}/`; }

	getParams() : string { return ""; }
	password() : string { return this._password; };
	hostName() : string { return this._hostName; }
	peerName() : string { return this.isHost() ? this._hostName : this._peerName; }
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

		if (this.isHost()) {
			this.updateRoomMetadata();
		}
		return connection;
	}
	hasConnection(id : string) : boolean { return this._connections.has(id); }
	connection(id : string) : Connection { return this._connections.get(id); }
	connections() : Map<string, Connection> { return this._connections; }
	getNumConnected() : number {
		let connections = 0;
		this._connections.forEach((connection : Connection) => {
			if (connection.connected()) {
				connections++;
			}
		});
		return connections;
	}
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

	flush() : void {
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

			if (!this._pinger.receivedPing(id) && connection.timeSinceRegistration() > 10000) {
				console.error(`Never received first ping from ${id}`);
				this.disconnect(DisconnectType.TIMEOUT, id);
			} else if (this._pinger.unresponsive(id)) {
				console.error(`Connection to ${id} timed out`);
				this.disconnect(DisconnectType.TIMEOUT, id);
			}
		});

		for (let i = 0; i < this._messageBuffer.size(); ++i) {
			const [fromId, incoming] = this._messageBuffer.get(i);
			if (this._messageCallbacks.has(incoming.type())) {
				this._messageCallbacks.get(incoming.type())(fromId, incoming);
			}
		}
		this._messageBuffer.clear();
	}

	register(dataConnection : DataConnection) : void {
		if (!this.isLabelValid(dataConnection.label)) {
			dataConnection.close();
			console.error("Error: invalid channel type: " + dataConnection.label);
			return;
		}
		const channelType = this.labelToChannelType(dataConnection.label);
		if (!dataConnection.open) {
			dataConnection.close();
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

		if (connection.banned()) {
			console.error("Warning: disallowed banned %s from joining", connection.id());
			connection.disconnect();
			return;
		}

		if (channels.ready() && !connection.registered()) {
			this._registerBuffer.push(connection);
		}
	}

	unregister(connection : DataConnection) : void {
		if (!defined(connection)) { return; }

		const channelType = this.labelToChannelType(connection.label);

		if (connection.open) {
			connection.close();

			if (this._connections.has(connection.peer)) {
				let channels = this._connections.get(connection.peer).channels();
				channels.delete(channelType);

				if (channels.disconnected()) {
					console.log("Client " + connection.peer + " disconnected.");
					this._connections.delete(connection.peer);
				}
			}
		}
		console.log("Closed " + connection.label + " connection to " + connection.peer);
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

	private preparePayload(msg : NetworkMessage) : [Uint8Array, boolean] {
		if (!msg.valid()) {
			console.error("Error: attempted to encode invalid message", msg);
			return [null, false];
		}

		return [encode(msg.exportObject()), true];
	}
	private sendPayload(id : string, type : ChannelType, payload : Uint8Array) : boolean {
		if (!this._connections.has(id)) {
			console.error("Error: trying to send payload to missing connection", id);
			return false;
		}

		if (!this._connections.get(id).connected()) {
			return false;
		}

		const channels = this._connections.get(id).channels();
		if (!channels.ready() || !channels.has(type)) {
			return false;
		}

		let delay = 0;
		if (Flags.devMode.get()) {
			// For debugging - fail to send UDP packet.
			if (type === ChannelType.UDP && settings.sendSuccessRate() < Math.random()) {
				return true;
			}

			delay += settings.delay();
			if (Date.now() % 3000 <= 500) {
				delay += settings.jitter() * (0.5 + 0.5 * Math.random());
			}
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

	// Same as send() but encode payload once
	broadcast(type : ChannelType, msg : NetworkMessage) : boolean {
		const [payload, payloadOk] = this.preparePayload(msg);
		if (!payloadOk) {
			return false;
		}

		this._connections.forEach((outgoing, id) => {
			this.sendPayload(id, type, payload);
		});
		return true;
	}
	send(id : string, type : ChannelType, msg : NetworkMessage) : boolean {
		const [payload, payloadOk] = this.preparePayload(msg);
		if (!payloadOk) {
			return false;
		}
		return this.sendPayload(id, type, payload);
	}

	callAll(clients : Map<number, string>, onSuccess : () => void, onError : () => void) : void {
		const callFn = () => {
			clients.delete(this.clientId());
			clients.forEach((id : string, clientId : number) => {
				this.queryMic((stream : MediaStream) => {
					this.call(id, clientId, stream);
					if (Flags.printDebug.get()) {
						console.log("Calling", id, clientId);
					}
				}, (e) => {
					if (game.tablets().hasTablet(clientId)) {
						const name = game.tablet(clientId).displayName();
						ui.chat(ChatType.ERROR, "Failed to call " + name + "!");
					}

					if (Flags.printDebug.get()) {
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
		if (this._mediaConnections.has(clientId)) {
			this._mediaConnections.get(clientId).close();
			this._mediaConnections.delete(clientId);
		}
		ui.removeStream(clientId);
	}
	protected closeMediaConnections() {
		this._mediaConnections.forEach((mc : MediaConnection, clientId : number) => {
			mc.close();
		});

		ui.removeStreams();
		this._mediaConnections.clear();
	}

	private disconnect(type : DisconnectType, id : string) : void {
		if (!this.hasConnection(id)) {
			return;
		}

		let connection = this.connection(id);

		if (type === DisconnectType.KICK) {
			connection.kick();
		} else {
			connection.disconnect();
		}

		if (connection.hasClientId()) {
			let msg = new GameMessage(GameMessageType.CLIENT_DISCONNECT);
			msg.setClientId(connection.clientId());
			game.handleMessage(msg);
			ui.handleClientMessage(msg);
		}

		if (this.isHost()) {
			this.updateRoomMetadata();
		}
	}

	// Handle client being disconnected message.
	handleDisconnect(msg : GameMessage) : void {
		if (!msg.hasClientId()) {
			console.error("Error: disconnect message does not have client ID", msg);
			return;
		}

		// Close any open voice channels
		this.closeMediaConnection(msg.getClientId());
	}

	onKick(clientId : number) : void {}
	kick(clientId : number) : void {
		let kicked = false;

		this._connections.forEach((connection : Connection) => {
			if (clientId === connection.clientId()) {
				this.onKick(clientId);
				this.disconnect(DisconnectType.KICK, connection.id());
				kicked = true;
			}
		});

		if (!kicked) {
			console.error("Failed to kick %d!", clientId);
		}
	}

	private updateRoomMetadata() : Promise<void> {
		return perch.updateRoom(this._hostName, this.getNumConnected() + 1, () => {
			if (Flags.printDebug.get()) {
				console.log("Update room successful");
			}
		}, () => {
			console.error("Error: failed to update server metadata");
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
		if (!msg.valid()) {
			console.error("Error: received invalid message over network", msg);
			return;
		}

		if (this._messageCallbacks.has(msg.type())) {
			if (msg.type() === NetworkMessageType.GAME) {
				this._messageBuffer.push([id, msg]);
			} else {
				this._messageCallbacks.get(msg.type())(id, msg);
			}
		}

	}
}