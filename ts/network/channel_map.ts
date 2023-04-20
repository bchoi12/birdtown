import { DataConnection } from 'peerjs'

import { ChannelType } from 'network/api'

import { isLocalhost } from 'util/common'
import { StatsTracker } from 'util/stats_tracker'

export enum ChannelStat {
	UNKNOWN,
	PACKETS,
	BYTES,
}

export class ChannelMap {
	private _channels : Map<ChannelType, DataConnection>;
	private _stats : Map<ChannelType, StatsTracker>;

	constructor() {
		this._channels = new Map();
		this._stats = new Map();
	}

	disconnected() : boolean { return !this.has(ChannelType.TCP); }
	ready() : boolean { return this.has(ChannelType.TCP) && this.has(ChannelType.UDP); }
	has(type : ChannelType) : boolean { return this._channels.has(type); }
	flushStat(type : ChannelType, stat : ChannelStat) : number { return this._stats.has(type) ? this._stats.get(type).flush(stat) : 0; }
	delete(type : ChannelType) : void {
		if (!this._channels.has(type)) {
			return;
		}
		if (isLocalhost()) {
			console.log("Deleting " + type + " channel to " + this._channels.get(type).peer);
		}

		this._channels.delete(type);
		this._stats.delete(type);
	}

	register(type : ChannelType, connection : DataConnection) {
		if (this._channels.has(type)) {
			console.error("Warning: overwriting channel " + type);
			this._channels.get(type).close();
		}

		this._channels.set(type, connection);
		this._stats.set(type, new StatsTracker());
		if (isLocalhost()) {
			console.log("Registered " + type + " channel to " + connection.peer);
		}
	}

	send(type : ChannelType, data : Uint8Array) {
		if (!this._channels.has(type)) {
			console.error("Error: missing " + type + " channel");
			return;
		}

		this._stats.get(type).add(ChannelStat.PACKETS, 1);
		this._stats.get(type).add(ChannelStat.BYTES, data.length);
		this._channels.get(type).send(data);
	}

	disconnect() : void {
		this._channels.forEach((connection, type) => {
			connection.close();
			this.delete(type);
		});
	}
}