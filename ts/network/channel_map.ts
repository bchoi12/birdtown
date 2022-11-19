import { DataConnection } from 'peerjs'

import { ChannelType } from 'network/connection'

import { isDev } from 'util/common'

export class ChannelMap {
	private _channels : Map<string, DataConnection>;

	constructor() {
		this._channels = new Map<string, DataConnection>();
	}

	has(type : ChannelType) : boolean { return this._channels.has(type); }
	get(type : ChannelType) : DataConnection { return this._channels.get(type); }

	register(connection : DataConnection) {
		if (this._channels.has(connection.label)) {
			console.error("Warning: overwriting channel " + connection.label);
			this._channels.get(connection.label).close();
		}

		this._channels.set(connection.label, connection);

		connection.on("close", () => {
			this._channels.delete(connection.label);

			if (isDev()) {
				console.log("Lost " + connection.label + " channel to " + connection.peer);
			}
		});
	}
}