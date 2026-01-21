
import { game } from 'game'
import { AttributeType, TraitType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { Bot } from 'game/entity/bird/bot'
import { AutoUseType } from 'game/entity/equip'
import { BuffType } from 'game/factory/api'
import { EquipFactory } from 'game/factory/equip_factory'
import { StepData } from 'game/game_object'

import { Fns } from 'util/fns'
import { Vec2 } from 'util/vector'

export class BasicBot extends Bot {

	private _pause : boolean;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BASIC_BOT, entityOptions);

		this._pause = true;
	}

	override initialize() : void {
		super.initialize();

		this.addBuff(BuffType.BOT, 1);
	}

	protected override botName() : string { return "Walker Bot"; }
	protected override traitMap() : Map<TraitType, number> {
		return new Map([
			[TraitType.ANGER, Fns.randomInt(50, 100)],
			[TraitType.CRUELTY, Fns.randomInt(30, 70)],
			[TraitType.CAUTION, Fns.randomInt(0, 40)],
			[TraitType.JUMPY, Fns.randomInt(30, 70)],
			[TraitType.PATIENCE, Fns.randomInt(30, 70)],
			[TraitType.RECKLESS, Fns.randomInt(30, 70)],
			[TraitType.SKILL, Fns.randomInt(30, 70)],
		]);
	}
	
	protected override walkDir() : number {
		if (this._pause) {
			return 0;
		}

		return this._behavior.moveDir().x;
	}

	protected override jumping() : boolean { return this._behavior.moveDir().y > 0.3; }
	protected override reorient() : void {
		this.setDir(Vec2.unitFromRad(this._behavior.angle()));
		this.setEquipDir(this._armDir);
	}
	protected override getEquipPair() : [EntityType, EntityType] {
		return [EquipFactory.nextWeapon(), EntityType.UNKNOWN];
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this.getAttribute(AttributeType.GROUNDED)) {
			this._pause = false;
		}
		this.setEquipUse(this._behavior.shouldFire() && !this._pause ? AutoUseType.HOLD : AutoUseType.OFF);
	}
}