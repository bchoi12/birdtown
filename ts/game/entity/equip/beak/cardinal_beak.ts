
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType, SoundType } from 'game/factory/api'

export class CardinalBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.CARDINAL_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.CARDINAL_BEAK; }
	override soundType() : SoundType { return SoundType.CARDINAL_SOUND; }
}