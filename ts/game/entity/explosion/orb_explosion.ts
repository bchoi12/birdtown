
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType } from 'game/factory/api'

export class OrbExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ORB_EXPLOSION, entityOptions);
	}

	override force() : number { return 0.6; }
	override materialType() : MaterialType { return MaterialType.PARTICLE_ORANGE; }
}