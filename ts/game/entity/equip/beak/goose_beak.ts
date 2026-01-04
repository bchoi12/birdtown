
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType, SoundType } from 'game/factory/api'

export class GooseBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.GOOSE_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.GOOSE_BEAK; }
	override soundType() : SoundType { return SoundType.HONK; }
}