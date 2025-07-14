
import { EntityType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'

export abstract class Enemy extends EntityBase {

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.ENEMY);
	}
}