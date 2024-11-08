
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType, SoundType } from 'game/factory/api'

export class OrbExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ORB_EXPLOSION, entityOptions);
	}

	override force() : number { return 0.8; }
	override materialType() : MaterialType { return MaterialType.PARTICLE_ORANGE; }
	override soundType() : SoundType { return SoundType.BOOM; }

}