
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class BotBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		const round = game.controller().round();
		const difficulty = game.controller().config().getDifficultyOr(0);

		return new Map([
			[StatType.DAMAGE_BOOST, -0.6 + 0.2 * difficulty],
			[StatType.HEALTH, Math.max(0, 25 * (round - 1))],
			[StatType.HEALTH_BOOST, -0.3 + 0.1 * difficulty],
			[StatType.SCALING, Math.max(0, -0.3 + 0.1 * difficulty)],
			[StatType.SPEED_BOOST, Math.min(0, -0.3 + 0.1 * difficulty)],
			[StatType.RELOAD_BOOST, Math.min(0, -0.6 + 0.2 * difficulty)],
		]);
	}
}