import { Attribute } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'

export abstract class Projectile extends EntityBase {

	constructor(entityType : EntityType, options : EntityOptions) {
		super(entityType, options);
	}

	override ready() : boolean {
		return super.ready() && this.attributes().has(Attribute.OWNER);
	}
}