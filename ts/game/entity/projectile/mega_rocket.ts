
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { RocketBase } from 'game/entity/projectile/rocket'

export class MegaRocket extends RocketBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.MEGA_ROCKET, entityOptions);

		this._explosionType = EntityType.MEGA_ROCKET_EXPLOSION;
		this._profile.setScaleFactor(2.5);
	}
}