
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Headwear } from 'game/entity/equip/headwear'
import { MeshType } from 'game/factory/api'

export class PigeonHair extends Headwear {

	constructor(options : EntityOptions) {
		super(EntityType.PIGEON_HAIR, options);
	}

	override meshType() : MeshType { return MeshType.PIGEON_HAIR; }

	override shouldHide(type : AttachType) : boolean { return type === AttachType.HEAD || type === AttachType.FOREHEAD; }

}