
import { game } from 'game'
import { GameState } from 'game/api'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { SpawnPoint } from 'game/entity/spawn_point'

import { LevelType } from 'game/system/api'
import { ClientState } from 'game/system/client_state'
import { GameMaker, GameMakerBase } from 'game/system/game_maker'

export class DuelMaker extends GameMakerBase implements GameMaker {
	
	// TODO: util for tracking and querying entities
	private _players : Array<Player>;
	private _spawnPoints : Array<SpawnPoint>;

	constructor() {
		super();

		this._players = new Array();
		this._spawnPoints = new Array();
	}

	players() : Array<Player> { return this._players; }

	override queryAdvance(current : GameState) : boolean {
		switch (current) {
		case GameState.WAIT:
			this._players = this.queryPlayers();
			break;
		case GameState.GAME:
			this._players = this.queryPlayers();
			break;
		}

		return this.canAdvance(current);
	}

	override canAdvance(current : GameState) : boolean {
		switch (current) {
		case GameState.WAIT:
			return this._players.length >= 2;
		case GameState.SETUP:
			return game.clientStates().matchAll<ClientState>((client : ClientState) => {
				return client.gameState() > GameState.SETUP;
			});
		case GameState.GAME:
			let alive = 0;
			for (const player of this._players) {
				if (!player.dead()) {
					alive++;
				}
			}
			return alive <= 1;
		case GameState.FINISH:
			return false;
		}

		return true;
	}

	override onStateChange(state : GameState) : void {
		switch (state) {
		case GameState.SETUP:
			this._players = this.queryPlayers();
			this._players.forEach((player : Player) => {
				player.setDeactivated(true);
			});
			game.level().loadLevel({
				level: LevelType.BIRDTOWN,
				seed: 1 + Math.floor(1000 * Math.random()),
			});
			this._players.forEach((player : Player) => {
				player.respawn();
				player.setDeactivated(true);
			});
			break;
		case GameState.GAME:
			this._players = this.queryPlayers();
			this._spawnPoints = this.querySpawnPoints();

			const numPlayers = this._players.length;
			const numSpawnPoints = this._spawnPoints.length;

			for (let i = 0; i < numPlayers; ++i) {
				let player = this._players[i];
				const spawn = this._spawnPoints[i % numSpawnPoints];
				player.setSpawn(spawn.getProfile().pos());
				player.respawn();
				player.setDeactivated(false);
			}
			break;
		}
	}

	private queryPlayers() : Array<Player> {
		return game.entities().getMap(EntityType.PLAYER).findAll<Player>((player : Player) => {
			return player.initialized();
		});
	}

	private querySpawnPoints() : Array<SpawnPoint> {
		return game.entities().getMap(EntityType.SPAWN_POINT).findAll<SpawnPoint>((spawn : SpawnPoint) => {
			return spawn.initialized();
		});
	}
}