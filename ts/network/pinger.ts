import { Client } from 'network/client'
import { ChannelType, Connection } from 'network/connection'
import { Host } from 'network/host'
import { Message, MessageType } from 'network/message'

import { defined } from 'util/common'

export class Pinger {
	private static readonly _pingInterval = 1000;
	private static readonly _maxPings = 4;

	private _ping : number;
	private _pings : Array<number>;
	private _pingTimes : Array<number>
	private _lastPingNumber : number;
	private _initialized : boolean;

	constructor() {
		this._ping = 0;
		this._pings = [];
		this._pingTimes = [];
		this._lastPingNumber = 0;
		this._initialized = false;
	}

	ping() : number { return this._ping; }

	initialize(connection : Connection) : void {
		if (this._initialized) {
			console.log("Warning: skipping initialization of pinger");
			return;
		}

		if (connection instanceof Host) {
			this.initializeForHost(connection);
		} else if (connection instanceof Client) {
			this.initializeForClient(connection);
		} else {
			console.log("Error: failed to initialize pinger.");
			return;
		}

		this._initialized = true;
	}

	private initializeForHost(host : Host) {
		host.addMessageCallback(MessageType.PING, (peer: string, msg : Message) => {
			if (!defined(msg.S)) {
				return;
			}

			host.send(peer, ChannelType.TCP, msg);
		});
	}

	private initializeForClient(client : Client) {
		client.addMessageCallback(MessageType.PING, (peer : string, msg : Message) => {
			if (!defined(msg.S)) {
				return;
			}

			const index = msg.S % Pinger._maxPings;
			this._pings[index] = Date.now() - this._pingTimes[index];

			this._pings.forEach((ping) => {
				this._ping += ping;
			})
			this._ping = Math.ceil(this._ping / this._pings.length);
		});

		setTimeout(() => {
			const success = client.send(client.hostName(), ChannelType.TCP, {
				T: MessageType.PING,
				S: this._lastPingNumber,
			});

			if (success) {
				this._pingTimes[this._lastPingNumber % Pinger._maxPings] = Date.now();
				this._lastPingNumber++;
			}
		}, Pinger._pingInterval);
	}
}