
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

import { SeededRandom } from 'util/seeded_random'

export class StatStickBuff extends Buff {

	private static readonly _stats : Array<StatType> = new Array(
		StatType.BURST_BOOST,
		StatType.CRIT_CHANCE,
		StatType.CRIT_BOOST,
		StatType.DAMAGE_BOOST,
		StatType.DAMAGE_CLOSE_BOOST,
		StatType.DAMAGE_FAR_BOOST,
		StatType.DAMAGE_RESIST_BOOST,
		StatType.DOUBLE_JUMPS,
		StatType.FIRE_BOOST,
		StatType.HEAL_PERCENT,
		StatType.HEALTH,
		StatType.HP_REGEN,
		StatType.LIFE_STEAL,
		StatType.SPEED_BOOST,
		StatType.USE_BOOST,
	);

	private _seed : number;
	private _rng : SeededRandom;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._seed = 0;
		this._rng = new SeededRandom(0);

		if (this.isSource()) {
			this.setSeed(Math.ceil(1000 * Math.random()));
		}

		this.addProp<number>({
			has: () => { return this._seed > 0; },
			import: (obj: number) => { this.setSeed(obj); },
			export: () => { return this._seed; },
		});
	}

	override ready() : boolean { return super.ready() && this._seed > 0; }

	override boosts(level : number) : Map<StatType, number> {
		this._rng.seed(this._seed);

		let boosts = new Map<StatType, number>();
		for (let i = 0; i < 2 * level; ++i) {
			const type = StatStickBuff._stats[this._rng.int(StatStickBuff._stats.length)];
			if (!boosts.has(type)) {
				boosts.set(type, Buff.getInterval(type));
			} else {
				boosts.set(type, boosts.get(type) + Buff.getInterval(type));
			}
		}
		return boosts;
	}

	private setSeed(seed : number) : void {
		this._seed = seed;
		this._rng.seed(seed);
	}
}