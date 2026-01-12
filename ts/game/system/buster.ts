
import { game } from 'game'
import { EntityType } from 'game/entity/api'
import { Bot } from 'game/entity/bird/bot'
import { Player } from 'game/entity/bird/player'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { SystemType } from 'game/system/api'
import { SystemBase, System } from 'game/system'

import { RateLimiter } from 'util/rate_limiter'
import { Vec2 } from 'util/vector'

export type BotLimit = {
	total : number;
	concurrent : number;
}

export class Buster extends SystemBase implements System {

	private static readonly _spawnInterval = 3000;

	private _botLimit : BotLimit;
	private _numDeployed : number;
	private _spawnLimiter : RateLimiter;

	private _playerList : Player[];
	private _playerRateLimiter : RateLimiter;

	constructor() {
		super(SystemType.BUSTER);

		this._botLimit = {
			total: 0,
			concurrent: 0,
		};
		this._numDeployed = 0; 
		this._spawnLimiter = new RateLimiter(Buster._spawnInterval);

		this._playerList = [];
		this._playerRateLimiter = new RateLimiter(250);

		this.addProp<number>({
			import: (obj : number) => { this._botLimit.total = obj; },
			export: () => { return this._botLimit.total; },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			import: (obj : number) => { this._botLimit.concurrent = obj; },
			export: () => { return this._botLimit.concurrent; },
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

	override canStep() : boolean { return super.canStep() && this._botLimit.total > 0; }

	setBotLimit(limit : BotLimit) : void {
		this._botLimit = limit;
	}

	playerList() : Player[] {
		return this._playerList;
	}

	processKillOn(bot : Bot) : void {
		if (this.isSource()) {
			const [damager, hasDamager] = bot.lastDamager();
			if (hasDamager) {
				game.tablet(damager.clientId())?.addKill();
			}

			this._botLimit.total--;
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

		if (this._botLimit.total <= 0) {
			return;
		}

		if (this._numDeployed >= this._botLimit.total || this._numDeployed >= this._botLimit.concurrent) {
			return;
		}

		if (!this._spawnLimiter.check(millis)) {
			return;
		}

		const bounds = game.level().bounds();
		const pos = new Vec2({
			x: bounds.xRand(),
			y: bounds.max.y,
		});

		const [bot, ok] = this.addEntity<Bot>(EntityType.WALKER_BOT, {
			profileInit: {
				pos: pos,
				vel: { x: 0, y: 0},
			},
		});

		if (ok) {
			bot.floatRespawn(pos);
			this._numDeployed++;
		}
	}
}