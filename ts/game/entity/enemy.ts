
import { AttributeType, TeamType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { EntityType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'

export abstract class Enemy extends EntityBase {

	protected _association : Association;
	protected _attributes : Attributes;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.ENEMY);

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._association.setTeam(TeamType.ENEMY);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);
	}
}