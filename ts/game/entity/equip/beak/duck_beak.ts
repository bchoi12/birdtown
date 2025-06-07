
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType, SoundType } from 'game/factory/api'

export class DuckBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.DUCK_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.DUCK_BEAK; }
	override soundType() : SoundType { return SoundType.QUACK; }
}