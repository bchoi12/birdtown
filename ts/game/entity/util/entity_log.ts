
import { AssociationType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'

export class EntityLog {
	
	private _id : number;
	private _type : EntityType;
	private _associations : Map<AssociationType, number>;

	constructor(entity : Entity) {
		this._id = entity.id();
		this._type = entity.type();
		this._associations = entity.getAssociations();
	}

	id() : number { return this._id; }
	type() : EntityType { return this._type; }
	associations() : Map<AssociationType, number> { return this._associations; }
}