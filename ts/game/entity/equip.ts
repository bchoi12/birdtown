
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { StepData } from 'game/game_object'

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

export abstract class Equip<E extends Entity & EquipEntity> extends EntityBase {

	protected _association : Association;
	protected _attributes : Attributes;
	protected _ownerId : number;
	protected _owner : E;
	// Networked counter for uses
	protected _uses : SavedCounter;
	protected _canUse : boolean;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.EQUIP);

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._ownerId = 0;
		this._owner = null;

		this._uses = new SavedCounter(0);
		this._canUse = false;

		this.addProp<number>({
			has: () => { return this._uses.count() > 0; },
			export: () => { return this._uses.count(); },
			import: (obj : number) => { this._uses.set(obj); },
		});
		this.addProp<boolean>({
			export: () => { return this.canUse(); },
			import: (obj : boolean) => { this.importCanUse(obj); },
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

	override update(stepData : StepData) : void {
		super.update(stepData)

		const uses = this._uses.save();
		if (!this.isSource() && uses > 0) {
			this.simulateUse(uses);
		}
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

	canUse() : boolean { return this._canUse; }
	setCanUse(can : boolean) : void {
		if (this.isSource()) {
			this._canUse = can;
		}
	}
	importCanUse(can : boolean) : void { this._canUse = can; }
	recordUse() : void {
		if (this.isSource()) {
			this.simulateUse(1);
			this._uses.add(1);
		}
	}
	protected simulateUse(uses : number) : void {}

	abstract attachType() : AttachType;
}
