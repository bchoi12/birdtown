
import { AttributeType } from 'game/component/api'
import { StepData } from 'game/game_object'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BulletBase } from 'game/entity/projectile/bullet'

export class Piercer extends BulletBase {
	constructor(entityOptions : EntityOptions) {
		super(EntityType.PIERCER, entityOptions);

		this.setAttribute(AttributeType.PIERCING, true);
		this.setSnapOnHit(false);
	}

	protected override trailScaling(stepData : StepData) : number {
		return Math.min(2, this._trail.scaling.x + 10 * stepData.millis / 1000);
	}
}