
import { game } from 'game'
import { AttributeType, TeamType, TraitType } from 'game/component/api'
import { BotBehavior } from 'game/component/bot_behavior'
import { Traits } from 'game/component/traits'
import { EntityType, BirdType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { Bird } from 'game/entity/bird'
import { AutoUseType } from 'game/entity/equip'
import { BuffType, TextureType } from 'game/factory/api'
import { EquipFactory } from 'game/factory/equip_factory'
import { StepData } from 'game/game_object'

import { Fns } from 'util/fns'
import { globalRandom } from 'util/seeded_random'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export abstract class Bot extends Bird {

	protected _birdType : BirdType;

	protected _behavior : BotBehavior;
	protected _traits : Traits;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BOT);

		this.setTeam(TeamType.ENEMY);

		this._behavior = this.addComponent<BotBehavior>(new BotBehavior({
			minRange: { x: 6, y: 1},
			maxRange: { x: 18, y: 10 },
		}));
		this._traits = this.addComponent<Traits>(new Traits({
			traits: this.traitMap(),
		}));

		this.addProp<BirdType>({
			has: () => { return this._birdType !== BirdType.UNKNOWN; },
			import: (obj : BirdType) => { this.setBirdType(obj); },
			export: () => { return this._birdType; }
		})
	}

	override ready() : boolean { return super.ready() && this._birdType !== BirdType.UNKNOWN; }

	setBirdType(type : BirdType) : void { this._birdType = type; }

	override displayName() : string { return this.botName(); }

	override takeDamage(delta : number, from? : Entity, hitEntity? : Entity) : void {
		super.takeDamage(delta, from, hitEntity);

		if (!this.isSource()) {
			return;
		}

		if (delta < 0 && from && from.hasType(EntityType.PLAYER)) {
			this._behavior.revengeTarget(from);
		}
	}

	protected abstract traitMap() : Map<TraitType, number>;
	protected abstract botName() : string;

	protected override birdType() : BirdType { return this._birdType; }

	protected override doubleJumping() : boolean { return this.jumping() && this._profile.vel().y < 0; }

	protected override onDead(dead : boolean) : void {
		super.onDead(dead);

		if (dead) {
			game.buster().processKillOn(this);

			this.setTTL(3000);
		}
	}
}

export class WalkerBot extends Bot {

	private _pause : boolean;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WALKER_BOT, entityOptions);

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

	protected override eyeTexture() : TextureType { return TextureType.RED_EYE; }
	
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