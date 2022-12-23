import { Attribute } from 'game/component/attributes'
import { Entity, EntityOptions, EntityType } from 'game/entity'

export abstract class Projectile extends Entity {

	constructor(entityType : EntityType, options : EntityOptions) {
		super(entityType, options);
	}

	override ready() : boolean {
		return super.ready() && this.attributes().has(Attribute.OWNER);
	}
}