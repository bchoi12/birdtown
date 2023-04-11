
import { game } from 'game'
import { ComponentType } from 'game/component'
import { Profile } from 'game/component/profile'
import { EntityType } from 'game/entity'
import { Player } from 'game/entity/player'
import { SpawnPoint } from 'game/entity/spawn_point'

import { SystemType } from 'game/system'
import { LevelType } from 'game/system/api'
import { GameMaker, GameMakerBase } from 'game/system/game_mode/game_maker'

export class DuelMaker extends GameMakerBase implements GameMaker {
	
	private _players : Array<Player>;
	private _spawnPoints : Array<SpawnPoint>;

	constructor() {
		super(SystemType.DUEL_MAKER);

		this._players = new Array();
		this._spawnPoints = new Array();
	}

	players() : Array<Player> { return this._players; }
	spawnPoints() : Array<SpawnPoint> { return this._spawnPoints; }

	override canSetup() : boolean { return this._players.length >= 2; }
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

		game.level().setLevel(LevelType.BIRDTOWN);
		game.level().setSeed(Math.floor(1000 * Math.random()));
		this._players.forEach((player : Player) => {
			player.respawn();
			player.setDeactivated(true);
		});
	}

	override canStart() : boolean { return game.clientStates().allLoaded() && this._players.length >= 2 && this._spawnPoints.length >= 2; }
	override queryStart() : boolean {
		if (!game.clientStates().allLoaded()) {
			return false;
		}

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

		game.level().finishLoad();

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