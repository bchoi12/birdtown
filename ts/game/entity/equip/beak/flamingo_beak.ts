
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType, SoundType } from 'game/factory/api'

export class FlamingoBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.FLAMINGO_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.FLAMINGO_BEAK; }
	override soundType() : SoundType { return SoundType.FLAMINGO_SOUND; }
}