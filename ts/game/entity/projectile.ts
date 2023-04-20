
import { ComponentType } from 'game/component/api'
import { Attribute, Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'

export abstract class Projectile extends EntityBase {

	protected _attributes : Attributes;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
	}

	override ready() : boolean {
		return super.ready() && this._attributes.hasAttribute(Attribute.OWNER);
	}

	abstract damage() : number;
}