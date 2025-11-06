
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { StepData } from 'game/game_object'
import { StatType } from 'game/factory/api'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns } from 'util/fns'
import { SavedCounter } from 'util/saved_counter'
import { Timer } from 'util/timer'
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

	protected static readonly _maxJuice = 100;

	protected _association : Association;
	protected _attributes : Attributes;
	protected _owner : E;
	// Networked counter for uses
	protected _uses : SavedCounter;
	protected _canUse : boolean;

	protected _juice : number;
	protected _juiceSinceGrounded : number;
	protected _chargeDelayTimer : Timer;
	protected _chargeRate : number;
	protected _canUseDuringDelay : boolean;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.EQUIP);

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));

		this._uses = new SavedCounter(0);
		this._canUse = false;

		this._juice = 0
		this._juiceSinceGrounded = 0;
		this._chargeDelayTimer = this.newTimer({
			canInterrupt: true,
		});
		this._chargeRate = 0;
		this._canUseDuringDelay = false;

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
		return super.ready() && this._association.hasRefreshedOwner() && this._association.owner().valid();
	}
	override hasClientId() : boolean { return this.hasOwner() ? this.owner().hasClientId() : super.hasClientId(); }
	override clientId() : number { return this.hasOwner() ? this.owner().clientId() : super.clientId(); }

	abstract attachType() : AttachType;

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();

		const hudType = this.hudType();

		if (hudType !== HudType.UNKNOWN) {
			hudData.set(this.hudType(), {
				charging: !this.canUse(),
				percentGone: this.hudPercent(),
				empty: true,
				keyType: this.useKeyType(),
			});
		}
		return hudData;
	}
	protected hudPercent() : number { return 1 - this._juice / Equip._maxJuice; }
	protected hudType() : HudType { return HudType.UNKNOWN; };
	protected useKeyType() : KeyType { return KeyType.ALT_MOUSE_CLICK; };

	override initialize() : void {
		super.initialize();

		this.owner().equip(this);
		this._juice = Equip._maxJuice;
		this._chargeRate = this.getStatOr(StatType.CHARGE_RATE, 0);
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (this.isSource()) {
			this._canUse = this.checkCanUse();
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData)

		if (!this.isSource()) {
			const uses = this._uses.save();
			if (uses > 0) {
				this.simulateUse(uses);
			}
		}
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);
		const millis = stepData.millis;

		if (this.owner().getAttribute(AttributeType.GROUNDED)) {
			this._juiceSinceGrounded = 0;
		}

		if (this.canCharge()) {
			this._juice += this._chargeRate * millis / 1000 * this.chargeMultiplier();
			this._juice = Math.min(this._juice, Equip._maxJuice);
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

		if (player.getAttribute(AttributeType.BUBBLED)) {
			return false;
		}

		return super.key(type, state);
	}

	override owner() : E { return <E>super.owner(); }

	protected hasJuice() : boolean {
		return this._juice >= this.getUseJuice();
	}
	protected checkCanUse() : boolean {
		return this.hasJuice() && (this._canUseDuringDelay || !this._chargeDelayTimer.hasTimeLeft());
	}
	protected canUse() : boolean { return this._canUse; }
	private importCanUse(can : boolean) : void { this._canUse = can; }
	protected recordUse(n? : number) : void {
		if (this.isSource()) {
			const uses = n ? n : 1;
			this.simulateUse(uses);
			this._uses.add(uses);
		}
	}
	private getUseJuice() : number {
		if (!this.hasStat(StatType.USE_JUICE)) {
			return 0;
		}

		let juice = this.getStat(StatType.USE_JUICE);
		if (this.hasOwner() && this.owner().hasStat(StatType.USE_BOOST)) {
			juice /= this.owner().getStat(StatType.USE_BOOST);
		}

		return juice;
	}

	protected canCharge() : boolean { return this._chargeRate > 0 && !this._chargeDelayTimer.hasTimeLeft(); }
	protected delayCharge(delay : number) : void {
		if (delay > 0) {
			this._chargeDelayTimer.start(delay);
		}
	}
	private chargeMultiplier() : number {
		if (this._juiceSinceGrounded <= 100) {
			return 1;
		}
		if (this._juiceSinceGrounded >= 400) {
			return 0;
		}

		return 1 - Fns.normalizeRange(100, this._juiceSinceGrounded, 400);
	}

	protected simulateUse(uses : number) : void {
		const juice = uses * this.getUseJuice();

		this._juice = Math.max(0, this._juice - juice);
		this._juiceSinceGrounded += juice;

		if (this.hasStat(StatType.CHARGE_DELAY)) {
			this.delayCharge(this.getStat(StatType.CHARGE_DELAY));
		}
	}
}
