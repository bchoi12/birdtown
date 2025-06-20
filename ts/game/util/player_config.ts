
import { game } from 'game'
import { GameMode } from 'game/api'
import { PlayerRole, WinConditionType } from 'game/system/api'
import { ClientDialog } from 'game/system/client_dialog'
import { PlayerState } from 'game/system/player_state'
import { Tablet } from 'game/system/tablet'

import { GameConfigMessage } from 'message/game_config_message'

import { globalRandom } from 'util/seeded_random'

export enum StartRole {
	UNKNOWN,

	PLAYING,
	TEAM_ONE,
	TEAM_TWO,
	SPECTATING,
}

export type PlayerInfo = {
	displayName: string;
	role : StartRole;
}

export class PlayerConfig {

	private static readonly _playingRoles = new Set<StartRole>([
		StartRole.PLAYING, StartRole.TEAM_ONE, StartRole.TEAM_TWO,
	]);

	private _defaultRole : StartRole;
	private _players : Map<number, PlayerInfo>;

	private constructor() {
		this._defaultRole = StartRole.PLAYING;
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
		case StartRole.PLAYING:
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

	removeInvalid() : void {
		this._players.forEach((info : PlayerInfo, id : number) => {
			if (!this.validId(id)) {
				this.deleteClient(id);
				console.log("remove ", id);
			}
		});
	}

	canPlay(msg : GameConfigMessage) : [Array<string>, boolean] {
		let errors = [];
		const [numPlayers, numTeams] = this.numPlayersAndTeams();

		if (msg.type() === GameMode.UNKNOWN) {
			return [["Unknown game mode"], false];
		}

		if (msg.hasPlayersMin() && numPlayers < msg.getPlayersMin()) {
			errors.push("Need at least " + msg.getPlayersMin() + " active players");
		}
		if (msg.hasPlayersMax() && numPlayers > msg.getPlayersMax()) {
			errors.push(msg.modeName() + " can only have up to " + msg.getPlayersMax() + " active players");
		}

		if (msg.getWinCondition() === WinConditionType.POINTS || msg.getWinCondition() === WinConditionType.TEAM_POINTS) {
			if (msg.getPointsOr(0) < 1) {
				errors.push("Points must be greater than 0")
			}
		}

		if (msg.getWinCondition() === WinConditionType.LIVES || msg.getWinCondition() === WinConditionType.TEAM_LIVES) {
			if (msg.getLivesOr(0) < 1) {
				errors.push("Lives must be greater than 0")
			}
		}

		if (msg.getWinCondition() === WinConditionType.TEAM_LIVES || msg.getWinCondition() === WinConditionType.TEAM_POINTS) {
			if (numTeams < 2) {
				errors.push("Need 2 teams with at least 1 player");
			}
		}
		return [errors, errors.length === 0];
	}
	numPlayers() : number {
		let players = 0;
		this._players.forEach((info : PlayerInfo) => {
			players++;
		});
		return players;
	}
	numPlayersAndTeams() : [number, number] {
		let players = 0;
		let teams = new Set();
		this._players.forEach((info : PlayerInfo) => {
			if (PlayerConfig._playingRoles.has(info.role)) {
				players++;
				teams.add(info.role);
			}
		});
		return [players, teams.size];
	}

	addClient(id : number) : boolean {
		if (!this.canAdd(id)) {
			console.error("Error: couldn't add client", id);
			return false;
		}

		this._players.set(id, {
			displayName: game.tablet(id).displayName(),
			role: this._defaultRole,
		});
		return true;
	}
	hasClient(id : number) : boolean { return this._players.has(id); }
	deleteClient(id : number) : void { this._players.delete(id); }

	hasInfo(id : number) : boolean { return this._players.has(id); }
	info(id : number) : PlayerInfo { return this._players.get(id); }
	playerMap() : Map<number, PlayerInfo> { return this._players; }

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
		case StartRole.PLAYING:
		case StartRole.TEAM_ONE:
		case StartRole.TEAM_TWO:
			return PlayerRole.PREPARING;
		case StartRole.SPECTATING:
			return PlayerRole.SPECTATING;
		}
		return PlayerRole.UNKNOWN;
	}
	setDefaultRole(role : StartRole) : void { this._defaultRole = role; }
	setRole(id : number, role : StartRole) : void {
		if (!this.validId(id) || role === StartRole.UNKNOWN) {
			console.error("Error: failed to set role %s for %d", StartRole[role], id);
			return;
		}

		this._players.get(id).role = role;
	}

	setTeams(teams : boolean, max? : number) : void {
		if (!teams) {
			this._defaultRole = StartRole.PLAYING;
			return;
		}

		this._defaultRole = StartRole.SPECTATING;
		this.assignTeams(false, max);
	}
	randomizeTeams(max? : number) : void {
		this.assignTeams(/*random=*/true, max);
	}
	private assignTeams(random : boolean, max? : number) : void {
		let players = Array.from(this._players.keys());

		if (random) {
			globalRandom.shuffle(players, max);
		}

		for (let i = 0; i < players.length; ++i) {
			if (max && i >= max) {
				this.setRole(players[i], StartRole.SPECTATING);
				continue;
			}

			this.setRole(players[i], i % 2 === 0 ? StartRole.TEAM_ONE : StartRole.TEAM_TWO);
		}
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