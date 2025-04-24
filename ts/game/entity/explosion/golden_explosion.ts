
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType } from 'game/factory/api'

export class GoldenExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.GOLDEN_EXPLOSION, entityOptions);
	}

	override force() : number { return 0.8; }
	override materialType() : MaterialType { return MaterialType.PARTICLE_YELLOW; }
}