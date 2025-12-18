
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType, SoundType } from 'game/factory/api'

export class PigeonBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.PIGEON_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.PIGEON_BEAK; }
	override soundType() : SoundType { return SoundType.PIGEON_COO; }

}