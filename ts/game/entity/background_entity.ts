import { game } from 'game'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'

export abstract class BackgroundEntity extends EntityBase implements Entity {

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);
		this.addType(EntityType.BACKGROUND_ENTITY);
	}
}

