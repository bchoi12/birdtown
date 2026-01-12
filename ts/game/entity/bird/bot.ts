
import { game } from 'game'
import { AttributeType, TeamType, TraitType } from 'game/component/api'
import { Targeter } from 'game/component/targeter'
import { Traits } from 'game/component/traits'
import { EntityType, BirdType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { Bird } from 'game/entity/bird'
import { AutoUseType } from 'game/entity/equip'
import { TextureType } from 'game/factory/api'
import { EquipFactory } from 'game/factory/equip_factory'
import { StepData } from 'game/game_object'

import { Fns } from 'util/fns'
import { globalRandom } from 'util/seeded_random'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export abstract class Bot extends Bird {

	protected static readonly _birdTypes = new Array(
		BirdType.BOOBY,
		BirdType.CARDINAL,
		BirdType.CHICKEN,
		BirdType.DUCK,
		BirdType.EAGLE,
		BirdType.FLAMINGO,
		BirdType.GOOSE,
		BirdType.PIGEON,
		BirdType.RAVEN,
		BirdType.ROBIN,
	);

	protected _birdType : BirdType;

	protected _targeter : Targeter;
	protected _traits : Traits;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BOT);

		this.setTeam(TeamType.ENEMY);

		this._birdType = Bot._birdTypes[Math.floor(Math.random() * Bot._birdTypes.length)];

		this._targeter = this.addComponent<Targeter>(new Targeter());
		this._traits = this.addComponent<Traits>(new Traits({
			traits: this.traitMap(),
		}));
	}

	override ready() : boolean { return super.ready() && this._birdType !== BirdType.UNKNOWN; }

	override displayName() : string { return this.botName(); }

	takeDamage(delta : number, from? : Entity, hitEntity? : Entity) : void {
		super.takeDamage(delta, from, hitEntity);

		if (!this.isSource()) {
			return;
		}

		if (delta < 0 && from && from.hasType(EntityType.PLAYER)) {
			if (this._traits.roll(TraitType.ANGER, 100 - this._targeter.getFrustration())) {
				this._targeter.setTarget(from);
			}
		}
	}

	protected abstract traitMap() : Map<TraitType, number>;
	protected abstract botName() : string;

	protected setBirdType(type : BirdType) : void { this._birdType = type; }
	protected override birdType() : BirdType { return this._birdType; }

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
	private _walkDir : number;
	private _walkTimer : Timer;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WALKER_BOT, entityOptions);

		this._pause = false;
		this._walkDir = Math.random() < 0.5 ? -1 : 1;
		this._walkTimer = this.newTimer({
			canInterrupt: true,
		});
	}

	override initialize() : void {
		super.initialize();

		this._walkTimer.interval(750, () => {
			this.turn();
		});
	}

	protected override botName() : string { return "Walker Bot"; }
	protected override traitMap() : Map<TraitType, number> {
		return new Map([
			[TraitType.ANGER, Fns.randomInt(80, 100)],
			[TraitType.CRUELTY, Fns.randomInt(30, 70)],
			[TraitType.PATIENCE, Fns.randomInt(0, 100)],
			[TraitType.SKILL, Fns.randomInt(5, 15)],
		]);
	}

	protected override eyeTexture() : TextureType { return TextureType.RED_EYE; }
	
	protected override walkDir() : number { return !this.getAttribute(AttributeType.GROUNDED) || this._pause ? 0 : this._walkDir; }

	protected override jumping() : boolean { return false; }
	protected override doubleJumping() : boolean { return false; }
	protected override reorient() : void {
		this.setDir(Vec2.unitFromRad(this._targeter.angle()));
		this.setEquipDir(this._armDir);
	}
	protected override getEquipPair() : [EntityType, EntityType] {
		return [EquipFactory.nextWeapon(), EntityType.UNKNOWN];
	}

	private turn() : void {
		if (!this.getAttribute(AttributeType.GROUNDED) || !this._pause && Math.random() < 0.4) {
			this._pause = true;
			this.setEquipUse(AutoUseType.OFF);
			this.setAltEquipUse(AutoUseType.OFF);
			return;
		}

		this._pause = false;
		this._walkDir = -this._walkDir;

		this.setEquipUse(this._targeter.inRange() ? AutoUseType.HOLD : AutoUseType.OFF);
	}
}