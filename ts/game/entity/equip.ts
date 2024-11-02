
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { Recoil } from 'game/util/recoil'

import { KeyType, KeyState } from 'ui/api'

import { SavedCounter } from 'util/saved_counter'
import { Vec2 } from 'util/vector'

export enum AttachType {
	UNKNOWN,

	NONE,
	ARM,
	ARMATURE,
	BACK,
	BEAK,
	EYE,
	FOREHEAD,
	HEAD,
	ROOT,
}

export enum RecoilType {
	UNKNOWN,

	NONE,
	SMALL,
	MEDIUM,
	LARGE,

	THROW,
	WHIP,
}

export abstract class Equip<E extends Entity & EquipEntity> extends EntityBase {

	private static readonly _recoil = new Map<RecoilType, Recoil>([
		[RecoilType.NONE, new Recoil()],
		[RecoilType.SMALL, new Recoil().setDist(0.1)],
		[RecoilType.MEDIUM, new Recoil().setDist(0.2)],
		[RecoilType.LARGE, new Recoil().setDist(0.3)],
		[RecoilType.THROW, new Recoil().setDist(0.1).setRotation({ y: Math.PI / 4 })],
		[RecoilType.WHIP, new Recoil().setDist(0.2).setRotation({ z: Math.PI / 5 })],
	]);

	protected _association : Association;
	protected _attributes : Attributes;
	protected _ownerId : number;
	protected _owner : E;
	// Networked counter for uses
	protected _uses : SavedCounter;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.EQUIP);

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._ownerId = 0;
		this._owner = null;

		this._uses = new SavedCounter(0);

		this.addProp<number>({
			has: () => { return this._uses.count() > 0; },
			export: () => { return this._uses.count(); },
			import: (obj : number) => { this._uses.set(obj); },
		});
	}

	override ready() : boolean {
		if (!super.ready() || !this._association.hasAssociation(AssociationType.OWNER)) {
			return false;
		}

		this._ownerId = this._association.getAssociation(AssociationType.OWNER);
		
		let foundOwner;
		[this._owner, foundOwner] = game.entities().getEntity<E>(this._ownerId);

		if (!foundOwner) {
			console.error("Error: could not find owner %d for equip", this._ownerId, this.name());
			this.delete();
			return false;
		}

		return true;
	}
	override hasClientId() : boolean { return this.hasOwner() ? this._owner.hasClientId() : super.hasClientId(); }
	override clientId() : number { return this.hasOwner() ? this._owner.clientId() : super.clientId(); }

	override initialize() : void {
		super.initialize();

		this._owner.equip(this);
	}

	override key(type : KeyType, state : KeyState) : boolean {
		if (!this.hasOwner()) {
			return false;
		}

		if (this.owner().type() !== EntityType.PLAYER) {
			return false;
		}

		const player = <Player>(<unknown>this.owner());
		if (player.dead()) {
			return false;
		}

		// TODO: probably need attribute specific to disabling equips in the future
		if (player.getAttribute(AttributeType.FLOATING)) {
			return false;
		}

		return super.key(type, state);
	}

	protected hasOwner() : boolean { return this._owner !== null; }
	owner() : E { return this._owner; }
	ownerId() : number { return this._ownerId; }

	// Record instance of equip use. Only needed if some action is performed on use (e.g. recoil)
	protected recordUse() : void { this._uses.add(1); }
	popUses() : number {
		const uses = this._uses.save();
		if (uses > 0) {
			this.simulateUse(uses);
		}
		return uses;
	}
	protected simulateUse(uses : number) : void {}

	recoil() : Recoil { return Equip._recoil.get(this.recoilType()); }
	protected recoilType() : number { return RecoilType.NONE; }

	abstract attachType() : AttachType;
}
