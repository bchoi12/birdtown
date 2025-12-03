
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { Optional } from 'util/optional'

export class BruiserBuff extends Buff {

	private static readonly _conditionals = new Set([StatType.DAMAGE_BOOST]);
	private static readonly _healthInterval = 150;

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.HEALTH, 0.5 * BruiserBuff._healthInterval * level],
			[StatType.SHIELD, 10 * level],
		]);
	}

	override conditionalStats() : Set<StatType> { return BruiserBuff._conditionals; }
	override conditionalBoost(type : StatType) : number {
		if (!BruiserBuff._conditionals.has(type)) {
			return 0;
		}

		const statCache = this.getStatCache();

		const bonusHealth = statCache.has(StatType.HEALTH) ? statCache.get(StatType.HEALTH) : 0;
		const healthBoost = 1 + (statCache.has(StatType.HEALTH_BOOST) ? statCache.get(StatType.HEALTH_BOOST) : 0);

		return 0.05 * Math.floor(bonusHealth * healthBoost / BruiserBuff._healthInterval);
	}
}