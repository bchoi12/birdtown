
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType } from 'game/factory/api'

export class BoobyBeak extends Beak {

	private static readonly _equipName = "booby beak";

	constructor(options : EntityOptions) {
		super(EntityType.BOOBY_BEAK, options);
	}

	override equipName() : string { return BoobyBeak._equipName; }
	override meshType() : MeshType { return MeshType.BOOBY_BEAK; }
}