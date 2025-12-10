
import { game } from 'game'

import { ChannelMap } from 'network/channel_map'

import { Optional } from 'util/optional'

export class Connection {
	
	private _id : string;
	private _displayName : string;
	private _connected : boolean;
	private _registerTime : Optional<number>;
	private _banned : boolean;
	private _channels : ChannelMap;
	private _voiceEnabled : boolean;
	private _clientId : number;

	constructor(id : string) {
		this._id = id;
		this._displayName = "";
		this._connected = true;
		this._registerTime = new Optional();
		this._channels = new ChannelMap();
		this._voiceEnabled = false;
		this._clientId = 0;
	}

	id() : string { return this._id; }
	channels() : ChannelMap { return this._channels; }
	connected() : boolean { return this._connected; }
	registered() : boolean { return this._registerTime.has(); }
	timeSinceRegistration() : number {
		return this._registerTime.has() ? Date.now() - this._registerTime.get() : -1;
	}
	banned() : boolean { return this._banned; }
	kick() : void {
		this._banned = true;
		this.disconnect();
	}
	disconnect() : void {
		this._channels.disconnect();
		this._connected = false;
		this._registerTime.clear();
	}

	voiceEnabled() : boolean { return this._voiceEnabled; }
	setVoiceEnabled(enabled : boolean) { this._voiceEnabled = enabled; }

	setClientId(id : number) : void {
		if (this.hasClientId()) {
			console.error("Warning: ovewriting client ID from %d to %d", this._clientId, id);
		}
		this._clientId = id;
		this._registerTime.set(Date.now());
	}
	hasClientId() : boolean { return this._clientId > 0; }
	clientId() : number { return this._clientId; }

	hasDisplayName() : boolean { return this.hasClientId() && game.displayName(this.clientId()).length > 0; }
	displayName() : string { return game.displayName(this.clientId()); }
}