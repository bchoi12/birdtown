/*
import { game } from 'game'
import { GameState } from 'game/api'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { SpawnPoint } from 'game/entity/spawn_point'
import { LevelType, PlayerRole } from 'game/system/api'
import { ClientDialog } from 'game/system/client_dialog'
import { GameMaker, DefaultMaker } from 'game/system/game_maker'
import { EntityQuery } from 'game/util/entity_query'

enum QueryType {
	UNKNOWN,

	INITIALIZED,
}

export class DuelMaker extends DefaultMaker implements GameMaker {
	
	private _players : EntityQuery<Player>;
	private _spawnPoints : EntityQuery<SpawnPoint>;

	constructor() {
		super();

		this._players = new EntityQuery<Player>(EntityType.PLAYER);
		this._players.registerQuery(QueryType.INITIALIZED, {
			query: (player : Player) => { return player.initialized(); },
			maxStaleness: 250,
		});
		this._spawnPoints = new EntityQuery<SpawnPoint>(EntityType.SPAWN_POINT);
		this._spawnPoints.registerQuery(QueryType.INITIALIZED, {
			query: (spawn : SpawnPoint) => { return spawn.initialized(); },
			maxStaleness: 1000,
		});
	}

	override valid(current : GameState) : boolean {
		switch (current) {
		case GameState.SETUP:
		case GameState.GAME:
		case GameState.FINISH:
			if (this.clientSetup().numConnected() < 2) {
				return false;
			}
			break;
		}
		return true;
	}

	override queryState(current : GameState) : GameState {
		const state = super.queryState(current);
		if (state !== current) {
			return state;
		}

		switch (current) {
		case GameState.FREE:
			this._players.query(QueryType.INITIALIZED);
			if (this._players.get(QueryType.INITIALIZED).length >= 2) {
				return GameState.SETUP;
			}
		case GameState.SETUP:
			if (game.clientDialogs().matchAll<ClientDialog>((client : ClientDialog) => {
				return client.gameState() > GameState.SETUP;
			})) {
				return GameState.GAME;
			}
		case GameState.GAME:
			const filtered = this._players.filter(QueryType.INITIALIZED, (player : Player) => {
				return !player.dead();
			});
			if (filtered.length <= 1) {
				return GameState.FINISH;
			}
		case GameState.FINISH:
			if (this.timeSinceStateChange() >= 1000) {
				return GameState.SETUP;
			}
			break;
		}

		return current;
	}

	override onStateChange(state : GameState) : void {
		super.onStateChange(state);

		let players : Player[];
		let spawnPoints : SpawnPoint[];

		switch (state) {
		case GameState.SETUP:
			// TODO: deactivate all entities?
			players = this._players.get(QueryType.INITIALIZED);
			game.level().loadLevel({
				level: LevelType.BIRDTOWN,
				seed: 1 + Math.floor(1000 * Math.random()),
			});
			break;
		case GameState.GAME:
			players = this._players.get(QueryType.INITIALIZED);
			players.forEach((player : Player) => {
				if (game.playerStates().hasPlayerState(player.clientId())) {
					game.playerState(player.clientId()).setRole(PlayerRole.GAMING);
				}
			});
			spawnPoints = this._spawnPoints.get(QueryType.INITIALIZED);

			const numPlayers = players.length;
			const numSpawnPoints = spawnPoints.length;

			for (let i = 0; i < numPlayers; ++i) {
				let player = players[i];
				const spawn = spawnPoints[i % numSpawnPoints];
				player.setSpawn(spawn.getProfile().pos());
				player.respawn();
				player.setDeactivated(false);
			}
			break;
		}
	}
}
*/