
import { game } from 'game'
import { PlayerRole } from 'game/system/api'
import { ClientDialog } from 'game/system/client_dialog'
import { PlayerState } from 'game/system/player_state'
import { Tablet } from 'game/system/tablet'

export type ClientInfo = {
	displayName: string;
	role : PlayerRole;
	team : number;
	disconnected : boolean;
}

export class ClientConfig {

	private _clients : Map<number, ClientInfo>;

	private constructor() {
		this._clients = new Map();
	}

	static empty() : ClientConfig { return new ClientConfig(); }
	static fromAll() : ClientConfig {
		let config = new ClientConfig();
		game.tablets().execute((tablet : Tablet) => {
			config.addClient(tablet.clientId());
		});
		return config;
	}
	static fromSetup() : ClientConfig {
		let config = new ClientConfig();

		game.tablets().executeIf((tablet : Tablet) => {
			config.addClient(tablet.clientId());
		}, (tablet : Tablet) => {
			return tablet.isSetup();
		});

		return config;
	}

	addClient(id : number) : void {
		if (!this.canAdd(id)) {
			console.error("Error: couldn't add client", id);
			return;
		}

		this._clients.set(id, {
			displayName: game.tablet(id).displayName(),
			role: PlayerRole.PREPARING,
			team: 0,
			disconnected: false,
		});
	}
	hasClient(id : number) : boolean { return this._clients.has(id); }
	deleteClient(id : number) : void { this._clients.delete(id); }
	clientMap() : Map<number, ClientInfo> { return this._clients; }

	role(id : number) : PlayerRole { return this.hasClient(id) ? this._clients.get(id).role : PlayerRole.SPECTATING; }
	setRole(id : number, role : PlayerRole) : void {
		if (!this.validId(id) || role === PlayerRole.UNKNOWN) {
			console.error("Error: failed to set role %s for %d", PlayerRole[role], id);
			return;
		}

		this._clients.get(id).role = role;
	}
	team(id : number) : number { return this.hasClient(id) ? this._clients.get(id).team : 0; }
	setTeam(id : number, team : number) : void {
		if (!this.validId(id)) {
			console.error("Error: failed to set team %d for %d", team, id);
			return;
		}

		this._clients.get(id).team = team;
	}
	disconnected(id : number) : boolean { return this.hasClient(id) ? this._clients.get(id).disconnected : true; }
	setDisconnected(id : number, disconnected : boolean) : void {
		if (!this._clients.has(id)) {
			console.error("Error: failed to set disconnected to %d for %d", disconnected, id);
			return;
		}

		this._clients.get(id).disconnected = disconnected;
	}
	private canAdd(id : number) : boolean {
		if (!game.playerStates().hasPlayerState(id)) {
			console.error("Error: client %d does not have PlayerState", id);
			return false;
		}
		if (!game.tablets().hasTablet(id)) {
			console.error("Error: client %d does not have Tablet", id);
			return false;
		}
		if (!game.clientDialogs().hasClientDialog(id)) {
			console.error("Error: client %d does not have ClientDialog", id);
			return false;
		}
		return true;
	}
	private validId(id : number) : boolean {
		if (!this._clients.has(id)) {
			console.error("Error: client %d does not exist", id);
			return false;
		}
		if (!this.canAdd(id)) {
			return false;
		}
		return true;
	}
	private playerState(id : number) : [PlayerState, boolean] {
		return [game.playerState(id), game.playerStates().hasPlayerState(id)];
	}
	private tablet(id : number) : [Tablet, boolean] {
		return [game.tablet(id), game.tablets().hasTablet(id)];
	}
	private clientDialog(id : number) : [ClientDialog, boolean] {
		return [game.clientDialog(id), game.clientDialogs().hasClientDialog(id)];
	}

	// Can play
	isPlayer(id : number) : boolean {
		if (!this.hasClient(id)) {
			return false;
		}

		const client = this._clients.get(id);
		if (client.disconnected || client.role === PlayerRole.SPECTATING) {
			return false;
		}

		if (!game.playerStates().hasPlayerState(id)) {
			return false;
		}
		if (!game.tablets().hasTablet(id)) {
			return false;
		}
		if (!game.clientDialogs().hasClientDialog(id)) {
			return false;
		}

		return true;
	}
	numPlayers() : number {
		let players = 0;
		this._clients.forEach((client : ClientInfo, id : number) => {
			if (this.isPlayer(id)) {
				players++;
			}
		});
		return players;
	}

	// Can play && currently playing (not out of game)
	isCurrentlyPlaying(id : number) : boolean {
		if (!this.isPlayer(id)) {
			return false;
		}

		const [playerState, ok] = this.playerState(id);
		if (ok && playerState.inGame()) {
			return true;
		}
		return false;
	}
	numCurrentlyPlaying() : number {
		let playing = 0;
		this._clients.forEach((client : ClientInfo, id : number) => {
			if (this.isCurrentlyPlaying(id)) {
				playing++;
			}
		});
		return playing;
	}
}