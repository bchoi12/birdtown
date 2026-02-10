
import { game } from 'game'
import { TeamType, TraitType } from 'game/component/api'
import { BotBehavior } from 'game/component/bot_behavior'
import { Traits } from 'game/component/traits'
import { EntityType, BirdType } from 'game/entity/api'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { Bird } from 'game/entity/bird'
import { TextureType } from 'game/factory/api'

import { SeededRandom, globalRandom } from 'util/seeded_random'
import { Vec, Vec2 } from 'util/vector'

export abstract class Bot extends Bird {

	protected _birdType : BirdType;

	protected _behavior : BotBehavior;
	protected _traits : Traits;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.BOT);

		this.setTeam(TeamType.ENEMY);

		this._behavior = this.addComponent<BotBehavior>(new BotBehavior({
			minRange: this.minRange(),
			maxRange: this.maxRange(),
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

	override displayName() : string {
		globalRandom.seed(this.id());
		return this.botName(globalRandom);
	}

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
	protected abstract botName(rng : SeededRandom) : string;

	protected abstract minRange() : Vec;
	protected abstract maxRange() : Vec;

	protected override birdType() : BirdType { return this._birdType; }
	protected override eyeTexture() : TextureType { return TextureType.RED_EYE; }

	protected override jumping() : boolean { return this._behavior.moveDir().y > 0.5; }
	protected override doubleJumping() : boolean { return this.jumping() && this._profile.vel().y < 0; }

	protected override reorient() : void {
		this.setDir(Vec2.unitFromRad(this._behavior.angle()));
		this.setEquipDir(this._armDir);
	}

	protected override onDead(dead : boolean) : void {
		super.onDead(dead);

		if (dead) {
			game.buster().processKillOn(this);
			this.setTTL(10000);
		}
	}
}