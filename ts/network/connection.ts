
import { ChannelMap } from 'network/channel_map'
import { defined } from 'util/common'

export class Connection {
	
	private _name : string;
	private _displayName : string;
	private _connected : boolean;
	private _channels : ChannelMap;
	private _voiceEnabled : boolean;
	private _clientId : number;

	constructor(name : string) {
		this._name = name;
		this._displayName = "";
		this._connected = true;
		this._channels = new ChannelMap();
		this._voiceEnabled = false;
		this._clientId = 0;
	}

	name() : string { return this._name; }
	channels() : ChannelMap { return this._channels; }
	setDisplayName(name : string) : void { this._displayName = name; }
	hasDisplayName() : boolean { return this._displayName.length > 0; }
	displayName() : string { return (this.hasDisplayName() ? this._displayName : "unknown") + " #" + (this.hasClientId() ? this.clientId() : "?"); }
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
}