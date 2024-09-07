
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType } from 'game/factory/api'

export class StarExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PARTICLE_PURPLE, entityOptions);
	}

	override force() : number { return 0.3; }
	override materialType() : MaterialType { return MaterialType.PARTICLE_PURPLE; }
}