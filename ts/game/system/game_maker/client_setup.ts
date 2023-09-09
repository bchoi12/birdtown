
import { game } from 'game'
import { PlayerState } from 'game/system/player_state'

type ClientState = {
}
type ClientConfig = {
}

export class ClientSetup {

	private _minRefreshTime : number;
	private _clients : Map<number, ClientState>;
	private _clientConfig : ClientConfig;
	private _lastRefreshTime : number;

	constructor(refreshTime : number) {
		this._minRefreshTime = refreshTime;
		this._clients = new Map();
		this._clientConfig = {};
		this._lastRefreshTime = Date.now();
	}

	numConnected() : number { return this._clients.size; }

	refresh() : void {
		this.prune();
		game.playerStates().findAll((playerState : PlayerState) => {
			return playerState.hasTargetEntity();
		}).forEach((playerState : PlayerState) => {
			this._clients.set(playerState.clientId(), {});
		});
		this.applyConfig();
	}
	prune() : void {
		this._clients.forEach((state : ClientState, id : number) => {
			if (!game.playerStates().hasPlayerState(id)) {
				this._clients.delete(id);
			}
		});
	}
	setConfig(config : ClientConfig) : void { this._clientConfig = config; }
	applyConfig() : void {
		
	}
}