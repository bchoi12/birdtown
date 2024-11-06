
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType, SoundType } from 'game/factory/api'

export class EagleBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.EAGLE_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.EAGLE_BEAK; }
	override soundType() : SoundType { return SoundType.EAGLE_SCREECH; }
	override squawkCooldown() : number { return 5000; }

}