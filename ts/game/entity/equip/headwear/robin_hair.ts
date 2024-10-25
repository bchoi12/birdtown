
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Headwear } from 'game/entity/equip/headwear'
import { MeshType } from 'game/factory/api'

export class RobinHair extends Headwear {

	constructor(options : EntityOptions) {
		super(EntityType.ROBIN_HAIR, options);
	}

	override meshType() : MeshType { return MeshType.ROBIN_HAIR; }
}