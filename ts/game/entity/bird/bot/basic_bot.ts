
import { game } from 'game'
import { AttributeType, TraitType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions, InteractEntity } from 'game/entity'
import { Bot } from 'game/entity/bird/bot'
import { Player } from 'game/entity/bird/player'
import { AutoUseType } from 'game/entity/equip'
import { BuffType } from 'game/factory/api'
import { EquipFactory } from 'game/factory/equip_factory'
import { StepData } from 'game/game_object'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

import { Fns } from 'util/fns'
import { SeededRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

import { StringFactory } from 'strings/string_factory'

export class BasicBot extends Bot implements InteractEntity {

	private static readonly _firstNames = new Array(
		"Bottimus",
		"Bottington",
		"Bottert",
		"Botterita",
		"Botter",
	);

	private static readonly _lastNames = new Array(
		"Esq.",
		"Sr.",
		"Jr.",
		"III",
		"IV",
		"Prime",
	);

	private _holdingWeapon : boolean;
	private _pause : boolean;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BASIC_BOT, entityOptions);

		this.addType(EntityType.INTERACTABLE);

		this._holdingWeapon = true;
		this._pause = true;

		this.addProp<boolean>({
			has: () => { return !this._holdingWeapon; },
			import: (obj : boolean) => { this.setHoldingWeapon(obj); },
			export: () => { return this._holdingWeapon; },
		});
	}

	override initialize() : void {
		super.initialize();

		this.addBuff(BuffType.BOT, 1);
	}

	protected override botName(rng : SeededRandom) : string {
		return rng.pick(BasicBot._firstNames) + " " + rng.pick(BasicBot._lastNames);
	}
	protected override traitMap() : Map<TraitType, number> {
		return new Map([
			[TraitType.ANGER, Fns.randomInt(80, 100)],
			[TraitType.CRUELTY, Fns.randomInt(30, 70)],
			[TraitType.CAUTION, Fns.randomInt(20, 80)],
			[TraitType.JUMPY, Fns.randomInt(30, 70)],
			[TraitType.PATIENCE, Fns.randomInt(30, 70)],
			[TraitType.RECKLESS, Fns.randomInt(30, 70)],
			[TraitType.SKILL, Fns.randomInt(30, 70)],
		]);
	}

	protected override minRange() : Vec {
		return { x: 7, y: 1 };
	}
	protected override maxRange() : Vec {
		return { x: 12, y: 10 };
	}
	
	protected override walkDir() : number {
		if (this._pause) {
			return 0;
		}

		return this._behavior.moveDir().x;
	}

	protected override getEquipPair() : [EntityType, EntityType] {
		return EquipFactory.next();
	}
	private equipList() : string {
		const pair = this.getEquipPair();
		return `${StringFactory.getEntityTypeName(this._equipType).toString()} and ${StringFactory.getEntityTypeName(this._altEquipType).toString()}`;
	}

	canInteractWith(entity : Entity) : boolean {
		return this.isSource() && this.dead() && this._holdingWeapon;
	}
	setInteractableWith(entity : Entity, interactable : boolean) : void {
		if (entity.type() !== EntityType.PLAYER || !this._holdingWeapon) {
			return;
		}

		const player = <Player>entity;

		if (player.isLakituTarget() && !player.hasBuff(BuffType.VIP) && interactable) {
			ui.showTooltip(TooltipType.LOOT_BOT, {
				ttl: 500,
				names: [this.equipList()],
			});
		}
	}
	interactWith(entity : Entity) : void {
		if (entity.type() !== EntityType.PLAYER || !this._holdingWeapon) {
			return;
		}

		const player = <Player>entity;
		if (!player.hasBuff(BuffType.VIP)) {
			player.createEquips(this.equipType(), this.altEquipType());
		}

		this.setHoldingWeapon(false);
	}
	private setHoldingWeapon(holding : boolean) : void {
		this._holdingWeapon = holding;

		if (!holding) {
			this.setTTL(1000);
			this.clearEquips();
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this.getAttribute(AttributeType.GROUNDED) && !this.getAttribute(AttributeType.BUBBLED)) {
			this._pause = false;
		}
		this.setEquipUse(this._behavior.shouldFire() && !this._pause ? AutoUseType.HOLD : AutoUseType.OFF);
	}
}