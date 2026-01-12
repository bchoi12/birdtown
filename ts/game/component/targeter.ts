
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, TraitType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/bird/player'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'

import { Flags } from 'global/flags'

import { Fns, InterpType } from 'util/fns'
import { Optional } from 'util/optional'
import { Stopwatch } from 'util/stopwatch'

export class Targeter extends ComponentBase implements Component {

	private static readonly _angleEpsilon = 0.1;
	// 8.6 deg
	private static readonly _angleNoise = 0.15;

	private static readonly _minAimTime = 150;
	private static readonly _maxAimTime = 450;

	private static readonly _minChaseTime = 1000;
	private static readonly _maxChaseTime = 15000;

	private _angle : number;
	private _angularVelocity : number;
	private _aimWatch : Stopwatch;

	private _inRange : boolean;
	private _target : Optional<Entity>;
	private _lastTargetTime : number;

	constructor() {
		super(ComponentType.TARGETER);

		this._angle = 0;
		this._angularVelocity = 0;
		this._aimWatch = new Stopwatch();

		this._inRange = false;
		this._target = new Optional();
		this._lastTargetTime = Date.now();

		this.addProp<number>({
			import: (obj : number) => { this._angle = obj; },
			export: () => { return this._angle; },
			options: {
				filters: GameData.udpFilters,
				equals: (a : number, b : number) => {
					return Math.abs(a - b) < Targeter._angleEpsilon;
				},
			},
		});

		this.addProp<number>({
			has: () => { return this._target.has(); },
			import: (obj : number) => { this.targetId(obj); },
			export: () => { return this._target.get().id(); },
		})
	}

	override reset() : void {
		super.reset();

		this._target.clear();
	}

	angle() : number { return this._angle; }
	inRange() : boolean { return this._inRange; }

	validTarget() : boolean {
		return this._target.has() && this._target.get().valid() && !this._target.get().dead();
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
	pickTarget(type : EntityType) : void {
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
		this._lastTargetTime = Date.now();
	}

	getFrustration() : number {
		return Math.floor(100 * Fns.normalizeRange(Targeter._minChaseTime, Date.now() - this._lastTargetTime, Targeter._maxChaseTime));
	}

	private targetId(id : number) : void {
		const [target, ok] = game.entities().getEntity(id);

		if (ok) {
			this.setTarget(target);
		} else if (Flags.printDebug.get()) {
			console.error("Warning: could not find target with id %d for %s", id, this.name());
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		// TODO: maybe allow targeting for other entities like bots
		this.evaluateTarget(EntityType.PLAYER);

		if (!this.validTarget()) {
			return;
		}

		this._aimWatch.elapse(millis);

		const skillWeight = Fns.normalizeRange(0, this.entity().getTrait(TraitType.SKILL), 100);
		const interval = Fns.lerpRange(Targeter._minAimTime, skillWeight, Targeter._maxAimTime);
		if (this._aimWatch.millis() >= interval) {
			const aimVec = game.level().vec2(this.entity().profile(), this._target.get().profile());

			const distSq = aimVec.lengthSq();

			this._inRange = distSq <= 250;

			const angleNoise =
				(1 - skillWeight)
				* Fns.normalizeRange(0, distSq, 150)
				* Targeter._angleNoise;

			const aimAngle = aimVec.angleRad();
			let angleDiff = Fns.minimizeRad(aimAngle - this._angle);

			if (Math.abs(angleDiff) < Math.random() * Math.abs(angleNoise)) {
				this._angularVelocity = 0;
			} else {
				angleDiff += angleNoise
				this._angularVelocity = 1000 / interval * angleDiff * Fns.lerpRange(0.8, skillWeight, 1.6);
			}
		}

		this._angle += this._angularVelocity * millis / 1000;
	}
}