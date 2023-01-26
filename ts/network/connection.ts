
import { ChannelMap } from 'network/channel_map'
import { defined } from 'util/common'

export class Connection {
	
	private _displayName : string;
	private _connected : boolean;
	private _channels : ChannelMap;

	private _gameId : number;

	constructor() {
		this._displayName = "unknown";
		this._connected = true;
		this._channels = new ChannelMap();
	}

	setGameId(id : number) : void { this._gameId = id; }
	hasGameId() : boolean { return defined(this._gameId); }
	gameId() : number { return this._gameId; }

	channels() : ChannelMap { return this._channels; }
	displayName() : string { return this.hasGameId() ? (this._displayName + "#" + this.gameId()) : "unknown"; }
	connected() : boolean { return this._connected; }

	disconnect() : void {
		this._channels.disconnect();
		this._connected = false;
	}

}