
import { ChannelType } from 'network/api'
import { Netcode } from 'network/netcode'
import { NetworkMessage, NetworkMessageType, NetworkProp } from 'message/network_message'

import { defined } from 'util/common'

export class Pinger {
	private static readonly _pingInterval = 1000;
	private static readonly _maxPings = 4;

	private _initialized : boolean;

	private _ping : number;
	private _pings : Array<number>;
	private _pingTimes : Array<number>
	private _lastPingNumber : number;

	private _peerPingTimes : Map<string, number>;

	constructor() {
		this._initialized = false;

		this._ping = 0;
		this._pings = [];
		this._pingTimes = [];
		this._lastPingNumber = 0;

		this._peerPingTimes = new Map();
	}

	ping() : number { return this._ping; }
	timeSincePing(peer : string) : number { return this._peerPingTimes.has(peer) ? Math.max(0, Date.now() - this._peerPingTimes.get(peer)) : 0; }

	initializeForHost(host : Netcode) {
		if (this._initialized) {
			console.log("Warning: skipping initialization of pinger");
			return;
		}

		host.addMessageCallback(NetworkMessageType.PING, (msg : NetworkMessage) => {
			this._peerPingTimes.set(msg.name(), Date.now());
			host.send(msg.name(), ChannelType.TCP, msg);
		});

		this._initialized = true;
	}

	initializeForClient(client : Netcode, hostName : string) {
		if (this._initialized) {
			console.log("Warning: skipping initialization of pinger");
			return;
		}

		client.addMessageCallback(NetworkMessageType.PING, (msg : NetworkMessage) => {
			this._peerPingTimes.set(msg.name(), Date.now());

			const index = msg.getProp<number>(NetworkProp.SEQ_NUM) % Pinger._maxPings;
			this._pings[index] = Date.now() - this._pingTimes[index];

			this._ping = 0;
			this._pings.forEach((ping : number) => {
				this._ping += ping;
			});
			this._ping = Math.ceil(this._ping / this._pings.length);
		});

		this.pingLoop(client, hostName, Pinger._pingInterval);
		this._initialized = true;
	}

	private pingLoop(connection : Netcode, hostName : string, interval : number) : void {
		if (connection.ready()) {
			let msg = new NetworkMessage(NetworkMessageType.PING);
			msg.setProp<number>(NetworkProp.SEQ_NUM, this._lastPingNumber);
			const success = connection.send(hostName, ChannelType.TCP, msg);

			if (success) {
				this._pingTimes[this._lastPingNumber % Pinger._maxPings] = Date.now();
				this._lastPingNumber++;
			}
		}

		setTimeout(() => {
			this.pingLoop(connection, hostName, interval);
		}, interval);
	}
}