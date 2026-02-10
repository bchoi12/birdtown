
import { game } from 'game'
import { AttributeType, TraitType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { Bot } from 'game/entity/bird/bot'
import { Player } from 'game/entity/bird/player'
import { AutoUseType } from 'game/entity/equip'
import { BuffType } from 'game/factory/api'
import { EquipFactory } from 'game/factory/equip_factory'
import { StepData } from 'game/game_object'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

import { Fns } from 'util/fns'
import { SeededRandom, globalRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

import { StringFactory } from 'strings/string_factory'

export class DuckBot extends Bot {

	private static readonly _firstNames = new Array(
		"Allen",
		"Baldy",
		"Daff",
		"Harley",
		"Mallardo",
		"Mandy",
	);

	private static readonly _lastNames = new Array(
		"Bufflehead",
		"Duckhead",
		"Green",
		"Jock",
		"McBaldy",
	);

	constructor(entityOptions : EntityOptions) {
		super(EntityType.DUCK_BOT, entityOptions);

		globalRandom.seed(this.id());
		const equipPair = globalRandom.pick([
			[EntityType.RED_GLOVE, EntityType.RED_HEADBAND],
			[EntityType.PURPLE_GLOVE, EntityType.PURPLE_HEADBAND],
		]);
		this._equipType = equipPair[0];
		this._altEquipType = equipPair[1];
	}

	override initialize() : void {
		super.initialize();

		this.addBuff(BuffType.BOT, 1);
	}

	protected override botName(rng : SeededRandom) : string {
		return rng.pick(DuckBot._firstNames) + " " + rng.pick(DuckBot._lastNames);
	}
	protected override traitMap() : Map<TraitType, number> {
		return new Map([
			[TraitType.ANGER, Fns.randomInt(80, 100)],
			[TraitType.CRUELTY, Fns.randomInt(80, 100)],
			[TraitType.CAUTION, Fns.randomInt(0, 20)],
			[TraitType.JUMPY, Fns.randomInt(40, 80)],
			[TraitType.PATIENCE, Fns.randomInt(60, 80)],
			[TraitType.RECKLESS, Fns.randomInt(40, 80)],
			[TraitType.SKILL, Fns.randomInt(20, 40)],
		]);
	}

	protected override minRange() : Vec {
		return { x: 3, y: 1 };
	}
	protected override maxRange() : Vec {
		return { x: 10, y: 10 };
	}
	
	protected override walkDir() : number {
		return this._behavior.moveDir().x;
	}

	protected override reorient() : void {
		this.setDir(Vec2.unitFromRad(this._behavior.angle()));
		this.setEquipDir(this._armDir);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		this.setEquipUse(this._behavior.shouldFire() ? AutoUseType.HOLD : AutoUseType.OFF);
	}
}