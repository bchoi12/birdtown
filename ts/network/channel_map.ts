import { DataConnection } from 'peerjs'

import { ChannelType } from 'network/connection'

import { isDev } from 'util/common'

export class ChannelMap {
	private _channels : Map<ChannelType, DataConnection>;

	constructor() {
		this._channels = new Map<ChannelType, DataConnection>();
	}

	ready() : boolean { return this.has(ChannelType.TCP) && this.has(ChannelType.UDP); }
	has(type : ChannelType) : boolean { return this._channels.has(type); }
	get(type : ChannelType) : DataConnection { return this._channels.get(type); }
	delete(type : ChannelType) : void {
		if (!this._channels.has(type)) {
			return;
		}
		if (isDev()) {
			console.log("Deleting " + type + " channel to " + this.get(type).peer);
		}

		this._channels.delete(type);
	}

	register(type : ChannelType, connection : DataConnection) {
		if (this._channels.has(type)) {
			console.error("Warning: overwriting channel " + type);
			this._channels.get(type).close();
		}

		this._channels.set(type, connection);
		if (isDev()) {
			console.log("Registered " + type + " channel to " + connection.peer);
		}
	}
}