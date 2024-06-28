
import { game } from 'game'

import { ChannelType } from 'network/api'
import { Netcode } from 'network/netcode'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { defined } from 'util/common'
import { NumberRingBuffer } from 'util/buffer/number_ring_buffer'

import { InfoType } from 'ui/api'

type PingData = {
	seqNum : number;
	timeSent : number;
	timeReceived? : number;
}

export class Pinger {
	private static readonly _pingInterval = 500;

	private _pingTimes : NumberRingBuffer;
	private _pingLoss : NumberRingBuffer;

	private _lastSent : number;
	private _lastSentTime : number;
	private _lastReceived : number;
	private _lastReceivedTime : Map<string, number>;

	constructor() {
		this._pingTimes = new NumberRingBuffer(3);
		this._pingLoss = new NumberRingBuffer(20);
		this._lastSent = 0;
		this._lastSentTime = Date.now();
		this._lastReceived = 0;
		this._lastReceivedTime = new Map();
	}

	ping() : number { return Math.ceil(this._pingTimes.average()); }
	pingLoss() : number { return this._pingLoss.average(); }

	// TODO: change to disconnected
	millisSincePing(peer : string) : number { return this._lastReceivedTime.has(peer) ? Math.max(0, Date.now() - this._lastReceivedTime.get(peer)) : 0; }

	initializeForHost(host : Netcode) {
		host.addMessageCallback(NetworkMessageType.PING, (msg : NetworkMessage) => {
			this._lastReceivedTime.set(msg.name(), Date.now());
			host.send(msg.name(), ChannelType.UDP, msg);
		});
	}

	initializeForClient(client : Netcode) {
		client.addMessageCallback(NetworkMessageType.PING, (msg : NetworkMessage) => {
			const seqNum = msg.getSeqNum();
			if (seqNum > this._lastSent) {
				console.error("Error: received ping response with future sequence number %d, last sent is %d", seqNum, this._lastSent);
				return;
			}

			// Consider all unacked packets to be losses
			for (let i = 1; i < seqNum - this._lastReceived; ++i) {
				this._pingLoss.push(1);
			}
			this._lastReceived = Math.max(this._lastReceived, seqNum);
			this._lastReceivedTime.set(msg.name(), Date.now());
			if (seqNum < this._lastSent) {
				return;
			}

			this._pingLoss.push(0);
			this._pingTimes.push(Date.now() - this._lastSentTime);

			if (game.tablets().hasTablet(client.clientId())) {
				game.tablet(client.clientId()).setInfo(InfoType.PING, this.ping());
			}
		});

		this.pingLoop(client, client.hostName(), Pinger._pingInterval);
	}

	private pingLoop(connection : Netcode, hostName : string, interval : number) : void {
		if (connection.ready()) {
			let msg = new NetworkMessage(NetworkMessageType.PING);
			msg.setSeqNum(this._lastSent + 1);
			const success = connection.send(hostName, ChannelType.UDP, msg);
			if (success) {
				this._lastSent++;
				this._lastSentTime = Date.now();
			}
		}

		setTimeout(() => {
			this.pingLoop(connection, hostName, interval);
		}, interval);
	}
}