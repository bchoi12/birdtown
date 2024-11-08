
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType, SoundType } from 'game/factory/api'

export class RobinBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.ROBIN_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.ROBIN_BEAK; }
	override soundType() : SoundType { return SoundType.BIRD_SONG; }
	override squawkCooldown() : number { return 3000; }
}