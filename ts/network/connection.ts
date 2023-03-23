
import { ChannelMap } from 'network/channel_map'
import { defined } from 'util/common'

// TODO: rename ConnectionInfo?
export class Connection {
	
	private _displayName : string;
	private _connected : boolean;
	private _channels : ChannelMap;

	private _stream : MediaStream;

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
	setDisplayName(name : string) : void { this._displayName = name; }
	displayName() : string { return this.hasGameId() ? (this._displayName + " #" + this.gameId()) : this._displayName; }
	connected() : boolean { return this._connected; }

	setStream(stream : MediaStream) : void { this._stream = stream; }
	hasStream() : boolean { return defined(this._stream); }
	stream() : MediaStream { return this._stream; }

	disconnect() : void {
		this._channels.disconnect();
		this._connected = false;
	}
}