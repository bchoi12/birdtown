
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Buffs } from 'game/component/buffs'
import { Entity } from 'game/entity'
import { BuffType, StatType } from 'game/factory/api'
import { BuffFactory } from 'game/factory/buff_factory'

import { Flags } from 'global/flags'

import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { Timer } from 'util/timer'

import { StringFactory } from 'strings/string_factory'

export type BuffOptions = {
	maxLevel : number;

	levelUp? : boolean;
	temporary? : boolean;
	resetOnSpawn? : boolean;
}

export type DecayOptions = {
	initial : number;
	subsequent : number;
}

export abstract class Buff extends ComponentBase implements Component {

	protected static readonly _emptyStats = new Set<StatType>();
	protected static readonly _emptyBoosts = new Map<StatType, number>();

	protected static readonly _intervals : Map<StatType, number> = new Map([
		[StatType.BURST_BONUS, 1],
		[StatType.BURST_BOOST, 0.25],
		[StatType.CHARGE_BOOST, 0.25],
		[StatType.CRIT_CHANCE, 0.1],
		[StatType.CRIT_BOOST, 0.2],
		[StatType.DAMAGE_ADDITION, 5],
		[StatType.DAMAGE_BOOST, 0.1],
		[StatType.DAMAGE_CLOSE_BOOST, 0.3],
		[StatType.DAMAGE_FAR_BOOST, 0.2],
		[StatType.DAMAGE_REDUCTION, 3],
		[StatType.DAMAGE_RESIST_BOOST, 0.1],
		[StatType.DAMAGE_TAKEN_BOOST, 0.1],
		[StatType.DOUBLE_JUMPS, 1],
		[StatType.FIRE_BOOST, 0.15],
		[StatType.HEALTH_ADDITION, 5],
		[StatType.HEALTH, 50],
		[StatType.HP_REGEN, .02],
		[StatType.PROJECTILE_SCALING_BOOST, 0.5],
		[StatType.SCALING, 0.1],
		[StatType.SLOW_CHANCE, 0.3],
		[StatType.SPEED_BOOST, 0.05],
		[StatType.SPEED_DEBUFF, 0.1],
		[StatType.LIFE_STEAL, 0.05],
		[StatType.USE_BOOST, 0.2],
	]);

	protected _buffType : BuffType;
	protected _level : number;
	protected _maxLevel : number;
	protected _levelUp : boolean;
	protected _temporary : boolean;
	protected _resetOnSpawn : boolean;
	protected _levelAnnounce : Optional<number>;

	protected _addTimer : Timer;

	constructor(type : BuffType, options : BuffOptions) {
		super(ComponentType.BUFF);

		this.addNameParams({
			type: BuffType[type],
		});

		this._buffType = type;
		this._level = 0;
		this._maxLevel = options.maxLevel;
		this._levelUp = options.levelUp;
		this._temporary = options.temporary;
		this._resetOnSpawn = options.temporary || options.resetOnSpawn;
		this._levelAnnounce = new Optional();

		this._addTimer = this.newTimer({
			canInterrupt: true,
		});
		
		this.addProp<number>({
			export: () => { return this._level; },
			import: (obj : number) => { this.setLevel(obj); },
		});
	}

	override delete() : void {
		super.delete();

		if (Flags.printDebug.get()) {
			console.log("%s: deleted %s from Lv%d", this.name(), BuffType[this._buffType], this.level());
		}

		if (this.level() > 0) {
			this.setLevel(0);	
		}
	}

	override canStep() : boolean { return this._level > 0 && super.canStep(); }

	applyStats(cache : Map<StatType, number>) : void {
		const level = this.level();
		if (level === 0) {
			return;
		}

		const boosts = this.boosts(level);
		boosts.forEach((delta : number, type : StatType) => {
			cache.set(type, (cache.has(type) ? cache.get(type) : 0) + delta);
		});
	}
	protected revertStats(cache : Map<StatType, number>) : void {
		const level = this.level();
		if (level === 0) {
			return;
		}

		const boosts = this.boosts(level);
		boosts.forEach((delta : number, type : StatType) => {
			cache.set(type, (cache.has(type) ? cache.get(type) : 0) - delta);
		});
	}

	buffType() : BuffType { return this._buffType; }

	static getInterval(type : StatType) : number {
		if (!Buff._intervals.has(type)) {
			console.error("Error: missing interval for stat", StatType[type]);
			return 0;
		}
		return Buff._intervals.get(type);
	}

	protected abstract boosts(level : number) : Map<StatType, number>;

	conditionalStats() : Set<StatType> { return Buff._emptyStats; }
	conditionalBoost(type : StatType) : number { return 0; }

	getStatCache() : Map<StatType, number> { return this.getParent<Buffs>().boostCache(); }

	preview(level : number) : Map<StatType, number> {
		if (level <= 0) {
			return new Map();
		}

		const prev = this.boosts(level - 1);
		let next = this.boosts(level);

		next.forEach((value : number, stat : StatType) => {
			if (prev.has(stat)) {
				next.set(stat, value - prev.get(stat));
			}

			if (Math.abs(next.get(stat)) < 1e-3) {
				next.delete(stat);
			}
		});

		return next;
	}

	levelUp() : void {
		if (this._levelUp && this.level() > 0) {
			this.addLevel(1);
		}
	}
	maxLevel() : number { return this._maxLevel; }
	atMaxLevel() : boolean { return this._level >= this._maxLevel; }
	level() : number { return this._level; }
	addLevel(delta : number) : void {
		if (delta === 0 || delta > 0 && this.atMaxLevel() || delta < 0 && this._level === 0) {
			this.onLevel(this._level, 0);
			return;
		}

		this.revertStats(this.getStatCache());
		this._level += delta;
		this._level = Fns.clamp(0, this._level, this._maxLevel);

		this.onLevel(this._level, delta);
	}
	setLevel(level : number) : void {
		level = Math.min(level, this._maxLevel);

		if (this._level === level) {
			return;
		}
		const delta = level - this._level;
		this.addLevel(delta);
	}
	protected onLevel(level : number, delta : number) : void {
		if (level === 0) {
			return;
		}

		if (level > 0 && delta !== 0) {
			this.applyStats(this.getStatCache());

			if (delta > 0 && StringFactory.hasBuffName(this._buffType)) {
				this._levelAnnounce.set(level);
			}
		}

		if (delta < 0) {
			this._levelAnnounce.clear();
		}
	}
	protected decayOnLevel(level : number, delta : number, options? : DecayOptions) : void {
		if (level <= 0) {
			return;
		}

		if (!options) {
			options = {
				initial: 2000,
				subsequent: 2000 / this.maxLevel(),
			}
		}

		if (delta >= 0) {
			this.addAfter(options.initial, -1);
		} else if (delta < 0) {
			this.addAfter(options.subsequent, -1);
		}
	}

	announceLevel() : void {
		if (this._levelAnnounce.has()) {
			const name = StringFactory.getBuffName(this._buffType);
			game.playerState(this.entity().clientId())?.chatBubble(`${name} Lv${this._levelAnnounce.get()}`);
			this._levelAnnounce.clear();
		}
	}

	adding() : boolean { return this._addTimer.hasTimeLeft(); }
	addAfter(millis : number, delta : number) : void {
		// Applying add refreshes timer
		this._addTimer.start(millis, () => {
			if (this.isSource()) {
				this.addLevel(delta);
			}
		});
	}
	temporary() : boolean { return this._temporary; }
	resetOnSpawn() : boolean { return this._resetOnSpawn; }
	onRespawn() : void {}
}