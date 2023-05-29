
import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'

import { Vec2 } from 'util/vector'

export type EquipInput = {
	enabled : boolean;
	millis : number;
	mouse : Vec2;
	dir : Vec2;
}

export abstract class Equip<E extends Entity> extends EntityBase {

	protected _attributes : Attributes;
	protected _ownerId : number;
	protected _owner : E;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this._allTypes.add(EntityType.EQUIP);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._ownerId = 0;
		this._owner = null;
	}

	override ready() : boolean { return super.ready() && this._attributes.getAttribute(AttributeType.OWNER) > 0; }

	override initialize() : void {
		super.initialize();

		this._ownerId = <number>this._attributes.getAttribute(AttributeType.OWNER);
		
		let foundOwner;
		[this._owner, foundOwner] = game.entities().getEntity<E>(this._ownerId);

		if (!foundOwner) {
			console.error("Error: could not find owner %d for equip", this._ownerId, this.name());
		}
	}

	owner() : E { return this._owner; }
	ownerId() : number { return this._ownerId; }

	abstract updateInput(input : EquipInput) : void;
}
