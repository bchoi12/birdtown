
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType } from 'game/factory/api'
import { SoundType } from 'game/system/api'

export class ChickenBeak extends Beak {

	private static readonly _equipName = "chicken beak";

	constructor(options : EntityOptions) {
		super(EntityType.CHICKEN_BEAK, options);
	}

	override equipName() : string { return ChickenBeak._equipName; }
	override meshType() : MeshType { return MeshType.CHICKEN_BEAK; }
	override soundType() : SoundType { return SoundType.BAWK; }
}