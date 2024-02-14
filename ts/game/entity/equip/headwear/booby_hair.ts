
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Headwear } from 'game/entity/equip/headwear'
import { MeshType } from 'game/factory/api'

export class BoobyHair extends Headwear {

	private static readonly _equipName = "booby hair";

	constructor(options : EntityOptions) {
		super(EntityType.BOOBY_HAIR, options);
	}

	override equipName() : string { return BoobyHair._equipName; }
	override meshType() : MeshType { return MeshType.BOOBY_HAIR; }
}