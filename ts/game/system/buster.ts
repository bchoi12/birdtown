
import { game } from 'game'
import { GameState } from 'game/api'
import { EntityType, BirdType } from 'game/entity/api'
import { Bot } from 'game/entity/bird/bot'
import { Player } from 'game/entity/bird/player'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { SystemType } from 'game/system/api'
import { SystemBase, System } from 'game/system'

import { RateLimiter } from 'util/rate_limiter'
import { SeededRandom } from 'util/seeded_random'
import { Vec2 } from 'util/vector'

export type BotConfig = {
	total : number;
	concurrent : number;
	seed: number;
}

export class Buster extends SystemBase implements System {

	protected static readonly _birdTypes = new Array(
		BirdType.BOOBY,
		BirdType.CARDINAL,
		BirdType.CHICKEN,
		BirdType.DUCK,
		BirdType.EAGLE,
		BirdType.FLAMINGO,
		BirdType.GOOSE,
		BirdType.PIGEON,
		BirdType.RAVEN,
		BirdType.ROBIN,
	);

	private static readonly _spawnInterval = 3000;

	private _botConfig : BotConfig;
	private _rng : SeededRandom;
	private _numDeployed : number;
	private _spawnPos : Array<number>;
	private _spawnIndex : number;
	private _spawnLimiter : RateLimiter;

	private _playerList : Player[];
	private _playerRateLimiter : RateLimiter;

	constructor() {
		super(SystemType.BUSTER);

		this._botConfig = {
			total: 0,
			concurrent: 0,
			seed: 0,
		};
		this._rng = new SeededRandom(0);
		this._numDeployed = 0;
		this._spawnPos = new Array(0, 1, 2, 3);
		this._spawnIndex = 0;
		this._spawnLimiter = new RateLimiter(Buster._spawnInterval);

		this._playerList = [];
		this._playerRateLimiter = new RateLimiter(250);

		this.addProp<number>({
			import: (obj : number) => { this._botConfig.total = obj; },
			export: () => { return this._botConfig.total; },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			import: (obj : number) => { this._botConfig.concurrent = obj; },
			export: () => { return this._botConfig.concurrent; },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			import: (obj : number) => { this._numDeployed = obj; },
			export: () => { return this._numDeployed; },
			options: {
				filters: GameData.tcpFilters,
			},
		});
	}

	override canStep() : boolean { return super.canStep() && this._botConfig.total > 0; }

	initBots(limit : BotConfig) : void {
		this._botConfig = limit;

		this._rng.seed(this._botConfig.seed);
		this._rng.shuffle(this._spawnPos);
		this._spawnIndex = Math.floor(Math.random() * this._spawnPos.length);
	}
	disableBots() : void {
		this._botConfig = {
			total: 0,
			concurrent: 0,
			seed: 0,
		}
	}
	roundComplete() : boolean {
		return this._botConfig.total === 0;
	}

	playerList() : Player[] {
		return this._playerList;
	}

	processKillOn(bot : Bot) : void {
		if (this.isSource()) {
			const [damager, hasDamager] = bot.lastDamager();
			if (hasDamager) {
				game.tablet(damager.clientId())?.addPointKill();
			}

			this._botConfig.total--;
			this._numDeployed--;
		}
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (this._playerRateLimiter.check(stepData.realMillis)) {
			this._playerList = game.entities().getMap(EntityType.PLAYER).findAll<Player>((player : Player) => {
				return player.valid() && !player.dead();
			});
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (game.controller().gameState() !== GameState.GAME) {
			return;
		}

		if (this._botConfig.total <= 0) {
			return;
		}

		if (this._numDeployed >= this._botConfig.total || this._numDeployed >= this._botConfig.concurrent) {
			return;
		}

		if (!this._spawnLimiter.check(millis)) {
			return;
		}

		const bounds = game.level().bounds();
		const pos = new Vec2({
			x: (this._spawnPos[this._spawnIndex % this._spawnPos.length] + Math.random()) * bounds.width() / this._spawnPos.length,
			y: bounds.max.y,
		});
		this._spawnIndex++;
		if (this._spawnIndex >= this._spawnPos.length) {
			this._rng.shuffle(this._spawnPos);
			this._spawnIndex = 0;
		}

		const [bot, ok] = this.addEntity<Bot>(EntityType.BASIC_BOT, {
			profileInit: {
				pos: pos,
				vel: { x: 0, y: 0},
			},
		});

		if (ok) {
			bot.setBirdType(Buster._birdTypes[Math.floor(Math.random() * Buster._birdTypes.length)])
			bot.respawn(pos);
			this._numDeployed++;
		}
	}
}