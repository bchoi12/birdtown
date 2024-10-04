
import { game } from 'game'

import { ChannelMap } from 'network/channel_map'
import { defined } from 'util/common'

export class Connection {
	
	private _id : string;
	private _displayName : string;
	private _connected : boolean;
	private _channels : ChannelMap;
	private _voiceEnabled : boolean;
	private _clientId : number;

	constructor(id : string) {
		this._id = id;
		this._displayName = "";
		this._connected = true;
		this._channels = new ChannelMap();
		this._voiceEnabled = false;
		this._clientId = 0;
	}

	id() : string { return this._id; }
	channels() : ChannelMap { return this._channels; }
	connected() : boolean { return this._connected; }
	disconnect() : void {
		this._channels.disconnect();
		this._connected = false;
	}

	voiceEnabled() : boolean { return this._voiceEnabled; }
	setVoiceEnabled(enabled : boolean) { this._voiceEnabled = enabled; }

	setClientId(id : number) : void { this._clientId = id; }
	hasClientId() : boolean { return this._clientId > 0; }
	clientId() : number { return this._clientId; }

	hasDisplayName() : boolean { return this.hasClientId() && game.displayName(this.clientId()).length > 0; }
	displayName() : string { return game.displayName(this.clientId()); }
}