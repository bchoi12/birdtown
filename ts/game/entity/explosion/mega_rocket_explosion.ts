
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType } from 'game/factory/api'

export class MegaRocketExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.MEGA_ROCKET_EXPLOSION, entityOptions);
	}

	override ttl() : number { return 2 * super.ttl(); }
	override force() : number { return 2; }
	override materialType() : MaterialType { return MaterialType.PARTICLE_RED; }
}