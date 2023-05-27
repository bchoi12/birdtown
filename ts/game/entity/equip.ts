
import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'

import { Vec2 } from 'util/vector'

export abstract class Equip extends EntityBase {

	protected _attributes : Attributes;

	// TODO: juice needs to be over network
	protected _juice : number;
	protected _owner : number;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this._allTypes.add(EntityType.EQUIP);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._juice = 100;
		this._owner = 0;
	}

	override ready() : boolean { return super.ready() && this._attributes.getAttribute(AttributeType.OWNER) > 0; }

	override initialize() : void {
		super.initialize();

		this._owner = <number>this._attributes.getAttribute(AttributeType.OWNER);
	}

	juice() : number { return this._juice; }

	abstract use(dir : Vec2) : boolean;
	abstract release(dir : Vec2) : boolean;
}
