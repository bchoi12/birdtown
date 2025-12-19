
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Headwear } from 'game/entity/equip/headwear'
import { MeshType } from 'game/factory/api'

export class FlamingoHair extends Headwear {

	constructor(options : EntityOptions) {
		super(EntityType.FLAMINGO_HAIR, options);
	}

	override meshType() : MeshType { return MeshType.FLAMINGO_HAIR; }
}