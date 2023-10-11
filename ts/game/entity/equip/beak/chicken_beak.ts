
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType } from 'game/factory/api'

export class ChickenBeak extends Beak {

	private static readonly _displayName = "chicken beak";

	constructor(options : EntityOptions) {
		super(EntityType.CHICKEN_BEAK, options);
	}

	override displayName() : string { return ChickenBeak._displayName; }
	override meshType() : MeshType { return MeshType.CHICKEN_BEAK; }
}