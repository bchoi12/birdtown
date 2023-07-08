
import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { SpawnPoint } from 'game/entity/spawn_point'

import { ClientLoadState, LevelType } from 'game/system/api'
import { ClientState } from 'game/system/client_state'
import { GameMaker, GameMakerBase } from 'game/system/game_maker'

export class DuelMaker extends GameMakerBase implements GameMaker {
	
	private _players : Array<Player>;
	private _spawnPoints : Array<SpawnPoint>;

	constructor() {
		super();

		this._players = new Array();
		this._spawnPoints = new Array();
	}

	players() : Array<Player> { return this._players; }
	spawnPoints() : Array<SpawnPoint> { return this._spawnPoints; }

	override canSetup() : boolean {
		if (this._players.length < 2) {
			return false;
		}

		return game.clientSideStates().queryClientStates((state : ClientState) => {
			return state.loadState() >= ClientLoadState.LOADED;
		});
	}
	override querySetup() : boolean {
		this._players = game.entities().queryEntities<Player>({
			type: EntityType.PLAYER,
			mapQuery: {
				filter: (player : Player) => { return player.initialized() && !player.dead(); },
			},
		});
		return this.canSetup();
	}
	override setup() : void {
		super.setup();

		game.level().setLevel({
			level: LevelType.BIRDTOWN,
			seed: Math.floor(1000 * Math.random()),
		});
		this._players.forEach((player : Player) => {
			player.respawn();
			player.setDeactivated(true);
		});
	}

	override canStart() : boolean {
		if (this._players.length < 2 && this._spawnPoints.length < 2) {
			return false;
		}

		return game.clientSideStates().queryClientStates((state : ClientState) => {
			return state.loadState() >= ClientLoadState.READY;
		});
	}

	override queryStart() : boolean {
		this._players = game.entities().queryEntities<Player>({
			type: EntityType.PLAYER,
			mapQuery: {
				filter: (player : Player) => { return player.initialized() && !player.dead(); },
			},
		});
		this._spawnPoints = game.entities().queryEntities<SpawnPoint>({
			type: EntityType.SPAWN_POINT,
			mapQuery: {
				filter: (spawn : SpawnPoint) => { return spawn.initialized(); },
			},
		});
		return this.canStart();
	}
	override start() : void {
		super.start();

		const numPlayers = this._players.length;
		const numSpawnPoints = this._spawnPoints.length;

		for (let i = 0; i < numPlayers; ++i) {
			let player = this._players[i];
			const spawn = this._spawnPoints[i % numSpawnPoints];
			player.setSpawn(spawn.getComponent<Profile>(ComponentType.PROFILE).pos());
			player.respawn();
			player.setDeactivated(false);
		}
	}

	override canFinish() : boolean {
		let alive = 0;
		for (const player of this._players) {
			if (!player.dead()) {
				alive++;
			}
		}
		return alive <= 1;
	}
	override queryFinish() : boolean {
		return this.canFinish();
	}
}