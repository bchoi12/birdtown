
import { ChannelMap } from 'network/channel_map'
import { defined } from 'util/common'

export class Connection {
	
	private _displayName : string;
	private _connected : boolean;
	private _channels : ChannelMap;
	private _voiceEnabled : boolean;
	private _gameId : number;

	constructor() {
		this._displayName = "";
		this._connected = true;
		this._channels = new ChannelMap();
		this._voiceEnabled = false;
		this._gameId = 0;
	}

	channels() : ChannelMap { return this._channels; }
	setDisplayName(name : string) : void { this._displayName = name; }
	hasDisplayName() : boolean { return this._displayName.length > 0; }
	displayName() : string { return (this.hasDisplayName() ? this._displayName : "unknown") + " #" + (this.hasGameId() ? this.gameId() : "?"); }
	connected() : boolean { return this._connected; }
	disconnect() : void {
		this._channels.disconnect();
		this._connected = false;
	}

	voiceEnabled() : boolean { return this._voiceEnabled; }
	setVoiceEnabled(enabled : boolean) { this._voiceEnabled = enabled; }

	setGameId(id : number) : void { this._gameId = id; }
	hasGameId() : boolean { return this._gameId > 0; }
	gameId() : number { return this._gameId; }
}