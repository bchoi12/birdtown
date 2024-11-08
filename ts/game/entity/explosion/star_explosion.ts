
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType, SoundType } from 'game/factory/api'

export class StarExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.STAR_EXPLOSION, entityOptions);
	}

	override force() : number { return 0.3; }
	override materialType() : MaterialType { return MaterialType.PARTICLE_PURPLE; }
	override soundType() : SoundType { return SoundType.SMALL_EXPLOSION; }
}