
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType } from 'game/factory/api'

export class RocketExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ROCKET_EXPLOSION, entityOptions);
	}

	override force() : number { return 1; }
	override materialType() : MaterialType { return MaterialType.ROCKET_EXPLOSION; }
}