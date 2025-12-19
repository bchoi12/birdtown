
import { Association } from 'game/component/association'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType, SoundType } from 'game/factory/api'

export class BlackHole extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BLACK_HOLE, entityOptions);
	}

	override force() : number { return -1.5; }
	override ttl() : number { return 300; }
	override materialType() : MaterialType { return MaterialType.BLACK_HOLE; }
	override soundType() : SoundType { return SoundType.UNKNOWN; }
}