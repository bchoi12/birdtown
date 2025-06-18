
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType, SoundType } from 'game/factory/api'

export class MiniOrbExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.MINI_ORB_EXPLOSION, entityOptions);
	}

	override force() : number { return 0.3; }
	override materialType() : MaterialType { return MaterialType.PARTICLE_YELLOW; }
	override soundType() : SoundType { return SoundType.BOOM; }

}