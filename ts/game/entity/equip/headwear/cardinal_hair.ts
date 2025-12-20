
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Headwear } from 'game/entity/equip/headwear'
import { MeshType } from 'game/factory/api'

export class CardinalHair extends Headwear {

	constructor(options : EntityOptions) {
		super(EntityType.CARDINAL_HAIR, options);
	}

	override meshType() : MeshType { return MeshType.CARDINAL_HAIR; }
}