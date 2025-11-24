
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { BuffType, StatType } from 'game/factory/api'


export class JuicedBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.BURST_BOOST, (this.atMaxLevel() && this.hasScouter()) ? 1 : 0],
			[StatType.FIRE_BOOST, this.atMaxLevel() ? -0.3 : 0.15 * level],
			[StatType.RELOAD_BOOST, this.atMaxLevel() ? -0.2 : 0.1 * level],
		]);
	}

	private hasScouter() : boolean {
		if (this.entity().type() !== EntityType.PLAYER) {
			return false;
		}

		return this.entity<Player>().altEquipType() === EntityType.SCOUTER;
	}
}