
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { Optional } from 'util/optional'

export class BruiserBuff extends Buff {

	private static readonly _healthInterval = 150;

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.HEALTH, BruiserBuff._healthInterval * level],
		]);
	}

	protected override postBoosts(statCache : Map<StatType, number>) : Map<StatType, number> {
		const bonusHealth = statCache.has(StatType.HEALTH) ? statCache.get(StatType.HEALTH) : 0;
		const healthBoost = 1 + (statCache.has(StatType.HEALTH_BOOST) ? statCache.get(StatType.HEALTH_BOOST) : 0);

		const scaling = Math.max(0, statCache.get(StatType.SCALING));

		return new Map([
			[StatType.DAMAGE_BOOST, 0.05 * Math.floor(2 * bonusHealth * healthBoost / BruiserBuff._healthInterval)],
			[StatType.DAMAGE_RESIST_BOOST, Math.min(0.5, 0.025 * Math.floor(10 * scaling))],
		]);
	}
}