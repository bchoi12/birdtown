
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { RocketBase } from 'game/entity/projectile/rocket'

export class MiniRocket extends RocketBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.MINI_ROCKET, entityOptions);

		this._explosionType = EntityType.ROCKET_EXPLOSION;
		this._profile.setScaleFactor(0.8);
	}
}