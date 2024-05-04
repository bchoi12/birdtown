
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Beak } from 'game/entity/equip/beak'
import { MeshType } from 'game/factory/api'

export class BoobyBeak extends Beak {

	constructor(options : EntityOptions) {
		super(EntityType.BOOBY_BEAK, options);
	}

	override meshType() : MeshType { return MeshType.BOOBY_BEAK; }
}