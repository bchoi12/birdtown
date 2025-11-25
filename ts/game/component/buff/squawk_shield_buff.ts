
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { AttributeType } from 'game/component/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
import { Shades } from 'game/entity/equip/shades'
import { BuffType, StatType } from 'game/factory/api'

export class SquawkShieldBuff extends Buff {

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);
	}

	override boosts(level : number) : Map<StatType, number> {
		// Squawk to shield
		return new Map([
			[StatType.SHIELD, 10 * level],
		]);
	}
}