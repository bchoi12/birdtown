
import { AttributeType } from 'game/component/api'
import { StepData } from 'game/game_object'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BulletBase } from 'game/entity/projectile/bullet'

export class Cartridge extends BulletBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CARTRIDGE, entityOptions);
	}

	protected override trailScaling(stepData : StepData) : number {
		return Math.min(2, this._trail.scaling.x + 8 * stepData.millis / 1000);
	}
}