
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, AttributeType, TraitType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/bird/player'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'

import { Flags } from 'global/flags'

import { Fns, InterpType } from 'util/fns'
import { Optional } from 'util/optional'
import { Stopwatch } from 'util/stopwatch'
import { Timer } from 'util/timer'
import { Vec, Vec2 } from 'util/vector'

export type BotBehaviorInitOptions = {
	minRange : Vec;
	maxRange : Vec;
}

export class BotBehavior extends ComponentBase implements Component {

	private static readonly _angleEpsilon = 0.1;
	// 6.9 deg
	private static readonly _angleNoise = 0.12;

	private static readonly _minAimTime = 200;
	private static readonly _maxAimTime = 400;

	private static readonly _minChaseTime = 1000;
	private static readonly _maxChaseTime = 15000;

	private _angle : number;
	private _angleDiff : number;
	private _angularVelocity : number;
	private _updateWatch : Stopwatch;

	private _minRange : Vec2;
	private _maxRange : Vec2;
	private _inRange : boolean;
	private _aimDir : Vec2;
	private _moveDir : Vec2;
	private _reverse : number;
	private _cross : number;
	private _hunting : boolean;

	private _jumpTimer : Timer;
	private _patrolTimer : Timer;

	private _target : Optional<Entity>;
	private _lastTargetTime : number;

	constructor(init : BotBehaviorInitOptions) {
		super(ComponentType.TARGETER);

		this._angle = 0;
		this._angleDiff = Math.PI;
		this._angularVelocity = 0;
		this._updateWatch = new Stopwatch();

		this._minRange = Vec2.fromVec(init.minRange);
		this._maxRange = Vec2.fromVec(init.maxRange);
		this._inRange = false;
		this._aimDir = Vec2.zero();
		this._moveDir = Vec2.zero();
		this._reverse = 0;
		this._cross = 0;
		this._hunting = false;
		this._jumpTimer = this.newTimer({
			canInterrupt: true,
		});
		this._patrolTimer = this.newTimer({
			canInterrupt: true,
		});

		this._target = new Optional();
		this._lastTargetTime = Date.now();

		this.addProp<number>({
			import: (obj : number) => { this._angle = obj; },
			export: () => { return this._angle; },
			options: {
				filters: GameData.udpFilters,
				equals: (a : number, b : number) => {
					return Math.abs(a - b) < BotBehavior._angleEpsilon;
				},
			},
		});
		this.addProp<number>({
			import: (obj : number) => { this._angularVelocity = obj; },
			export: () => { return this._angularVelocity; },
			options: {
				filters: GameData.udpFilters,
			},
		});
		this.addProp<Vec>({
			export: () => { return this._moveDir; },
			import: (obj : Vec) => {
				this._moveDir.copyVec(obj);
			},
			options: {
				filters: GameData.udpFilters,
			},
		});

		this.addProp<number>({
			has: () => { return this._target.has(); },
			import: (obj : number) => { this.targetId(obj); },
			export: () => { return this._target.get().id(); },
		});
	}

	override reset() : void {
		super.reset();

		this._target.clear();
	}

	override initialize() : void {
		super.initialize();

		this.startJumpTimer();
	}

	angle() : number { return this._angle; }
	inRange() : boolean { return this._inRange; }
	shouldFire() : boolean { return this.inRange() && this.validTarget() && Math.abs(this._angleDiff) < 2 * BotBehavior._angleNoise; }

	targetExists() : boolean {
		return this._target.has() && this._target.get().valid();
	}
	validTarget() : boolean {
		return this.targetExists() && !this._target.get().dead() && !this._target.get().getAttribute(AttributeType.BUBBLED);
	}
	evaluateTarget(type : EntityType) : void {
		if (!this.isSource()) {
			return;
		}

		if (!this.validTarget()) {
			this.pickTarget(type);
			return;
		}

		const frustration = this.getFrustration();
		if (frustration <= 0) {
			return;
		}

		if (!this.entity().rollTrait(TraitType.PATIENCE, frustration)) {
			this.pickTarget(type);
		}
	}
	revengeTarget(entity : Entity) : void {
		if (!this.isSource()) {
			return;
		}

		if (!this.validTarget()
			|| !this._hunting && this.entity().rollTrait(TraitType.ANGER, 10)
			|| this._hunting && this.entity().rollTrait(TraitType.ANGER, this.getFrustration())) {
			this.setTarget(entity);
		}
	}
	pickTarget(type : EntityType) : void {
		if (!this.isSource()) {
			return;
		}

		const players = game.buster().playerList();

		let target = null;
		let minScore = 0;

		players.forEach((player : Player) => {
			let score = Math.round(game.level().distSq(this.entity().profile(), player.profile()));

			score -= 10 * this.entity().randTrait(TraitType.CRUELTY) / player.health();
			if (this._target.has() && this._target.get().id() === player.id()) {
				score -= this.entity().randTrait(TraitType.PATIENCE);
			}

			if (target === null || score < minScore) {
				target = player;
				minScore = score;
			}
		});

		if (target !== null) {
			this.setTarget(target);
		}
	}

	setTarget(entity : Entity) : void {
		this._target.set(entity);
		this._hunting = true;
		this._lastTargetTime = Date.now();
	}

	getFrustration() : number {
		if (!this.validTarget()) {
			return 100;
		}
		return Math.floor(100 * Fns.normalizeRange(BotBehavior._minChaseTime, Date.now() - this._lastTargetTime, BotBehavior._maxChaseTime));
	}
	moveDir() : Vec2 {
		return this._moveDir;
	}

	private targetId(id : number) : void {
		const [target, ok] = game.entities().getEntity(id);

		if (ok) {
			this.setTarget(target);
		} else if (Flags.printDebug.get()) {
			console.error("Warning: could not find target with id %d for %s", id, this.name());
		}
	}
	private startJumpTimer() : void {
		this._jumpTimer.start(Fns.randomInt(3000, 6000) + Fns.normalizeRange(3000, this.entity().getTraitWeight(TraitType.JUMPY), 0));
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (!this.isSource()) {
			return;
		}

		const millis = stepData.millis;

		// TODO: maybe allow targeting for other entities like bots
		this.evaluateTarget(EntityType.PLAYER);

		this._updateWatch.elapse(millis);

		const skillWeight = this.entity().getTraitWeight(TraitType.SKILL);
		const interval = Fns.lerpRange(BotBehavior._maxAimTime, skillWeight, BotBehavior._minAimTime);
		if (this._updateWatch.millis() >= interval) {

			if (this.targetExists()) {
				this._aimDir = game.level().vec2(this.entity().profile(), this._target.get().profile());

				if (this._inRange) {
					this._inRange = Math.abs(this._aimDir.x) <= 1.8 * this._maxRange.x && Math.abs(this._aimDir.y) <= 1.8 * this._maxRange.y;
				} else {
					this._inRange = Math.abs(this._aimDir.x) <= this._maxRange.x && Math.abs(this._aimDir.y) <= this._maxRange.y;
				}
			} else {
				this._inRange = false;
				this._hunting = false;
			}

			if (this._hunting || this._inRange) {
				this._moveDir.copyVec({
					x: Math.sign(this._aimDir.x) * Fns.normalizeRange(this._minRange.x, Math.abs(this._aimDir.x), this._maxRange.x),
					y: Math.sign(this._aimDir.y) * Fns.normalizeRange(this._minRange.y, Math.abs(this._aimDir.y), this._maxRange.y),
				});

				if (Math.abs(this._aimDir.y) <= 2 * this._minRange.y || !this.entity().rollTrait(TraitType.JUMPY, 100)) {
					this._moveDir.y = 0;
				}

				if (this._reverse >= 0) {
					if (Math.abs(this._aimDir.x) <= 1.5 * this._minRange.x) {
						if (this._cross === 0 && this.entity().rollTrait(TraitType.RECKLESS, 300)) {
							this._cross = Math.sign(this._aimDir.x);
						}
					} else {
						this._cross = 0;

						if (Math.abs(this._aimDir.x) <= 0.8 * this._maxRange.x
							&& (game.level().isCircle() || game.level().bounds().xSide(this.entity().profile().pos(), -4) === 0)
							&& this.entity().rollTrait(TraitType.CAUTION, 500)) {
							this._reverse = -Fns.randomInt(10, 20);
						}
					}
				} else {
					if (Math.abs(this._aimDir.x) >= 0.8 * this._maxRange.x) {
						this._reverse += Fns.randomInt(2, 4);
					}
				}
			} else {
				if (this._reverse < 0) {
					// Go back and hunt
					this._hunting = true;
					this._reverse = 0;
				} else {
					if (!this._patrolTimer.hasTimeLeft()) {
						// Make a new patrol decision
						const rand = Math.random();
						if (rand < 0.5) {
							this._moveDir.x = Math.random() < 0.5 ? -0.75 : 0.75;
						} else if (rand < 0.75) {
							this._moveDir.x = 0;
						}

						this._patrolTimer.start(Fns.randomInt(4, 8) * interval);
					}
					this._moveDir.y = 0;
				}
			}

			if (this._cross !== 0) {
				this._moveDir.x = this._cross;
				this._moveDir.y = this._aimDir.y >= -0.2 ? 1 : 0;
			} else if (this._reverse < 0) {
				this._moveDir.x = -this._moveDir.x;
				this._reverse++;
			}

			if (this._jumpTimer.done() || this.entity().rollTrait(TraitType.JUMPY, 1500)) {
				if (this._inRange || this.entity().rollTrait(TraitType.JUMPY, 1500)) {
					this._moveDir.y = 1;
				}
				this.startJumpTimer();
			}

			if (this._cross === 0) {
				this._moveDir.x *= Fns.lerpRange(0.75, 1 - this.entity().getTraitWeight(TraitType.CAUTION), 1);
			}

			if (this._inRange) {
				const distSq = this._aimDir.lengthSq();
				const angleNoise =
					(1.2 - skillWeight)
					* Fns.normalizeRange(0, distSq, 150)
					* BotBehavior._angleNoise;

				const aimAngle = this._aimDir.angleRad();
				this._angleDiff = Fns.minimizeRad(aimAngle - this._angle);

				if (Math.abs(this._angleDiff) < (1.2 - skillWeight) * Math.abs(angleNoise)) {
					this._angularVelocity = 0;
				} else {
					this._angularVelocity = 1000 / interval * (this._angleDiff + angleNoise) * Fns.lerpRange(0.8, skillWeight, 1.2);
				}
			} else {
				this._angularVelocity = 0;
			}
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const millis = stepData.millis;

		if (this._inRange) {
			this._angle += this._angularVelocity * millis / 1000;
		} else {
			this._angle = this._moveDir.x < 0 ? Math.PI : 0;
		}
	}
}