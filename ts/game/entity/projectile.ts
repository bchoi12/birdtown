
import { AssociationType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'

export abstract class Projectile extends EntityBase {

	protected _association : Association;
	protected _attributes : Attributes;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
	}

	override ready() : boolean {
		return super.ready() && this._association.hasAssociation(AssociationType.OWNER);
	}

	abstract damage() : number;
}