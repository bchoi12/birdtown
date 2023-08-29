
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
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

export enum RecoilType {
	UNKNOWN = 0,

	NONE = 0,
	SMALL = 0.1,
	MEDIUM = 0.2,
	LARGE = 0.3,
}

export abstract class Equip<E extends Entity & EquipEntity> extends EntityBase {

	protected _association : Association;
	protected _attributes : Attributes;
	protected _ownerId : number;
	protected _owner : E;
	protected _keys : Set<KeyType>;
	// Networked counter for uses
	protected _useCounter : number;
	// Local copy for uses
	protected _consumedUseCounter : number;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this._allTypes.add(EntityType.EQUIP);

		this.addNameParams({
			base: "equip",
			id: this.id(),
		});

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._ownerId = 0;
		this._owner = null;
		this._keys = new Set();

		this._useCounter = 0;
		this._consumedUseCounter = 0;

		this.addProp<number>({
			has: () => { return this._useCounter > 0; },
			export: () => { return this._useCounter; },
			import: (obj : number) => { this._useCounter = obj; },
		})
	}

	override ready() : boolean { return super.ready() && this._association.hasAssociation(AssociationType.OWNER); }

	override initialize() : void {
		super.initialize();

		this._ownerId = this._association.getAssociation(AssociationType.OWNER);
		
		let foundOwner;
		[this._owner, foundOwner] = game.entities().getEntity<E>(this._ownerId);

		if (!foundOwner) {
			console.error("Error: could not find owner %d for equip", this._ownerId, this.name());
			this.delete();
			return;
		}

		this._owner.equip(this);
	}

	owner() : E { return this._owner; }
	ownerId() : number { return this._ownerId; }

	addKey(type : KeyType) : void { this._keys.add(type); }
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

	// Record instance of equip use. Only needed if some action is performed on use (e.g. recoil)
	protected recordUse() : void { this._useCounter++; }
	hasUse() : boolean { return this._useCounter > this._consumedUseCounter; }
	consumeUses() : void { this._consumedUseCounter = this._useCounter; }
	recoilType() : number { return RecoilType.NONE; }

	abstract attachType() : AttachType;
	abstract updateInput(input : EquipInput) : boolean;
}
