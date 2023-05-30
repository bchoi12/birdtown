
import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'

import { KeyType } from 'ui/api'

import { Vec2 } from 'util/vector'

export type EquipInput = {
	keys : Set<KeyType>;
	millis : number;
	mouse : Vec2;
	dir : Vec2;
}

export enum AttachType {
	UNKNOWN,

	NONE,
	ARM,
}

export abstract class Equip<E extends Entity & EquipEntity> extends EntityBase {

	protected _attributes : Attributes;
	protected _ownerId : number;
	protected _owner : E;
	protected _keys : Set<KeyType>;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this._allTypes.add(EntityType.EQUIP);

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._ownerId = 0;
		this._owner = null;
		this._keys = new Set();
	}

	override ready() : boolean { return super.ready() && this._attributes.getAttribute(AttributeType.OWNER) > 0; }

	override initialize() : void {
		super.initialize();

		this._ownerId = <number>this._attributes.getAttribute(AttributeType.OWNER);
		
		let foundOwner;
		[this._owner, foundOwner] = game.entities().getEntity<E>(this._ownerId);

		if (!foundOwner) {
			console.error("Error: could not find owner %d for equip", this._ownerId, this.name());
			return;
		}

		this._owner.equip(this);
	}

	owner() : E { return this._owner; }
	ownerId() : number { return this._ownerId; }

	addKey(type : KeyType) : void { this._keys.add(type); }
	keys() : Set<KeyType> { return this._keys; }
	keysIntersect(other : Set<KeyType>) : boolean {
		if (other.size === 0) { return false; }

		const small = this._keys.size < other.size ? this._keys : other;
		const large = this._keys.size < other.size ? other : this._keys;

		for (let key of small) {
			if (large.has(key)) {
				return true;
			}
		}
		return false;
	}

	abstract attachType() : AttachType;
	abstract updateInput(input : EquipInput) : void;
}
