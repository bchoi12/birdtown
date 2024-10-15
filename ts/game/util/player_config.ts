
import { game } from 'game'
import { PlayerRole } from 'game/system/api'
import { ClientDialog } from 'game/system/client_dialog'
import { PlayerState } from 'game/system/player_state'
import { Tablet } from 'game/system/tablet'

export enum StartRole {
	UNKNOWN,

	NO_TEAM,
	TEAM_ONE,
	TEAM_TWO,
	SPECTATING,
}

export type PlayerInfo = {
	displayName: string;
	role : StartRole;
}

export class PlayerConfig {

	private _defaultRole : StartRole;
	private _players : Map<number, PlayerInfo>;

	private constructor() {
		this._defaultRole = StartRole.NO_TEAM;
		this._players = new Map();
	}

	static empty() : PlayerConfig { return new PlayerConfig(); }
	static fromAll() : PlayerConfig {
		let config = new PlayerConfig();
		game.tablets().execute((tablet : Tablet) => {
			config.addClient(tablet.clientId());
		});
		return config;
	}
	static fromSetup() : PlayerConfig {
		let config = new PlayerConfig();

		game.tablets().executeIf((tablet : Tablet) => {
			config.addClient(tablet.clientId());
		}, (tablet : Tablet) => {
			return tablet.isSetup();
		});

		return config;
	}

	static roleString(role : StartRole) : string {
		switch (role) {
		case StartRole.NO_TEAM:
			return "PLAYING";
		case StartRole.TEAM_ONE:
			return "TEAM ONE";
		case StartRole.TEAM_TWO:
			return "TEAM TWO";
		case StartRole.SPECTATING:
			return "SPECTATING ONLY";
		}
		return "???";
	}

	addClient(id : number) : void {
		if (!this.canAdd(id)) {
			console.error("Error: couldn't add client", id);
			return;
		}

		this._players.set(id, {
			displayName: game.tablet(id).displayName(),
			role: this._defaultRole,
		});
	}
	hasClient(id : number) : boolean { return this._players.has(id); }
	deleteClient(id : number) : void { this._players.delete(id); }
	playerMap() : Map<number, PlayerInfo> { return this._players; }

	setDefaultRole(role : StartRole) : void { this._defaultRole = role; }

	role(id : number) : StartRole {
		if (!this.hasClient(id)) {
			return this._defaultRole;
		}
		return this._players.get(id).role;
	}
	playerRole(id : number) : PlayerRole {
		return this.toPlayerRole(this.role(id));
	}
	private toPlayerRole(role : StartRole) : PlayerRole {
		switch (role) {
		case StartRole.NO_TEAM:
		case StartRole.TEAM_ONE:
		case StartRole.TEAM_TWO:
			return PlayerRole.PREPARING;
		case StartRole.SPECTATING:
			return PlayerRole.SPECTATING;
		}
		return PlayerRole.UNKNOWN;
	}
	setRole(id : number, role : StartRole) : void {
		if (!this.validId(id) || role === StartRole.UNKNOWN) {
			console.error("Error: failed to set role %s for %d", StartRole[role], id);
			return;
		}

		this._players.get(id).role = role;
	}

	setTeams(teams : boolean) : void {
		if (!teams) {
			this._defaultRole = StartRole.NO_TEAM;
			return;
		}

		this._defaultRole = StartRole.SPECTATING;
		let role = StartRole.TEAM_ONE;
		this._players.forEach((info : PlayerInfo, id : number) => {
			this.setRole(id, role);

			role = role === StartRole.TEAM_ONE ? StartRole.TEAM_TWO : StartRole.TEAM_ONE;
		});
	}
	team(id : number) : number {
		if (!this.hasClient(id)) {
			return 0;
		}

		switch (this.role(id)) {
		case StartRole.TEAM_ONE:
			return 1;
		case StartRole.TEAM_TWO:
			return 2;
		}
		return 0;
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
		if (!this._players.has(id)) {
			console.error("Error: client %d does not exist", id);
			return false;
		}
		if (!this.canAdd(id)) {
			return false;
		}
		return true;
	}
}