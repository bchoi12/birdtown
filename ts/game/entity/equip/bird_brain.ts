import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'

import { GameGlobals } from 'global/game_globals'

import { CounterType, KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { Timer} from 'util/timer'
import { Vec2 } from 'util/vector'

export class BirdBrain extends Equip<Player> {

	private static readonly _densityAdjustment = 0.1;
	private static readonly _pickableTypes = new Set<EntityType>([
		EntityType.CRATE,
	]);

	private _targetId : Optional<number>;

	private _usageTimer : Timer;
	private _canCharge : boolean;
	private _juice : number;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BIRD_BRAIN, entityOptions);

		this._targetId = new Optional();
		this._usageTimer = this.newTimer({
			canInterrupt: false,
		});
		this._canCharge = false;
		this._juice = 100;

		this.addProp<number>({
			export: () => { return this._juice; },
			import: (obj : number) => { this._juice = obj; },
		});
	}

	override displayName() : string { return "bird brain"; }
	override attachType() : AttachType { return AttachType.NONE; }
	
	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this._canCharge) {
			this._juice = Math.min(100, this._juice + 1.6);
		}	

		if (this._juice <= 0 || !this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this.resetTarget();
			return;
		}

		// Move current target, reset if invalid
		const mouse = this.inputMouse();
		if (this._targetId.has()) {
			let [target, hasTarget] = game.entities().getEntity(this._targetId.get());
			if (hasTarget) {
				target.profile().moveTo(mouse, {
					millis: millis,
					posEpsilon: 0.5,
					maxAccel: 3,
				});
				this._juice = Math.max(0, this._juice - 0.83);
				this._canCharge = false;
			} else {
				this.resetTarget();
			}
			return;
		}

		// Try to pick a new target
		let clampedMouse = mouse.clone();
		game.level().clampPos(clampedMouse);
		let entities = game.entities().getMap(EntityType.CRATE).findAll((crate : Entity) => {
			return crate.profile().contains(clampedMouse);
		});

		for (let entity of entities) {
			let valid = false;
			for (let type of entity.allTypes()) {
				if (BirdBrain._pickableTypes.has(type)) {
					valid = true;
					break;
				}
			}

			if (!valid) { continue; }

			if (entity.getAttribute(AttributeType.BRAINED)) {
				continue;
			}

			this.resetTarget(entity.id());
			return;
		}
	}

	override getCounts() : Map<CounterType, number> {
		return new Map([
			[CounterType.JUICE, this._juice],
		]);
	}

	private resetTarget(id? : number) : void {
		if (this._targetId.has()) {
			let [target, hasTarget] = game.entities().getEntity(this._targetId.get());

			if (hasTarget) {
				let profile = target.profile();
				profile.setAcc({x: 0, y: GameGlobals.gravity });
				profile.clearLimits();
				MATTER.Body.setDensity(profile.body(), profile.body().density / BirdBrain._densityAdjustment);
				target.setAttribute(AttributeType.BRAINED, false);
			}
		}

		if (id) {
			let [target, hasTarget] = game.entities().getEntity(id);
			if (hasTarget) {
				let profile = target.profile();
				profile.mergeLimits({
					maxSpeed: { x: 5, y: 5},
				});
				MATTER.Body.setDensity(profile.body(), BirdBrain._densityAdjustment * profile.body().density);

				target.setAttribute(AttributeType.BRAINED, true);

				this._targetId.set(id);
			}
		} else {
			this._targetId.clear();
		}

		this._usageTimer.start(500, () => {
			this._canCharge = true;
		});
	}
}