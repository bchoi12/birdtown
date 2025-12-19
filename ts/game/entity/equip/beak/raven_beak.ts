
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType, SoundType } from 'game/factory/api'

export class RavenBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.RAVEN_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.RAVEN_BEAK; }
	override soundType() : SoundType { return SoundType.CAW; }
}