
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Headwear } from 'game/entity/equip/headwear'
import { MeshType } from 'game/factory/api'

export class ChickenHair extends Headwear {

	private static readonly _equipName = "chicken hair";

	constructor(options : EntityOptions) {
		super(EntityType.CHICKEN_HAIR, options);
	}

	override equipName() : string { return ChickenHair._equipName; }
	override meshType() : MeshType { return MeshType.CHICKEN_HAIR; }
}