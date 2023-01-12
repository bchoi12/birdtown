
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'

export abstract class Projectile extends EntityBase {

	protected _attributes : Attributes;

	constructor(entityType : EntityType, options : EntityOptions) {
		super(entityType, options);

		this._attributes = this.getComponent<Attributes>(ComponentType.ATTRIBUTES);
	}

	override ready() : boolean {
		return super.ready() && this._attributes.has(Attribute.OWNER);
	}
}