
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BoundBase } from 'game/entity/bound'

// Has special handling for smoother stitching
export class Floor extends BoundBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.FLOOR, entityOptions);
	}
}