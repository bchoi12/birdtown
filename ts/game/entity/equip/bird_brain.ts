
import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, EquipInput, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'

import { GameGlobals } from 'global/game_globals'

import { CounterType } from 'ui/api'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { Timer } from 'util/timer'
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

	constructor(options : EntityOptions) {
		super(EntityType.BIRD_BRAIN, options);

		this._targetId = new Optional();
		this._usageTimer = this.newTimer();
		this._canCharge = false;
		this._juice = 100;

		this.addProp<number>({
			export: () => { return this._juice; },
			import: (obj : number) => { this._juice = obj; },
		});
	}

	override attachType() : AttachType { return AttachType.NONE; }
	override updateInput(input : EquipInput) : boolean {
		if (this._juice <= 0 || !this.keysIntersect(input.keys)) {
			this.resetTarget();
			return false;
		}

		// Move current target, reset if invalid
		if (this._targetId.has()) {
			let [target, hasTarget] = game.entities().getEntity(this._targetId.get());
			if (hasTarget) {
				target.getProfile().moveTo(input.mouse, {
					millis: input.millis,
					posEpsilon: 0.5,
					maxAccel: 3,
				});
				this._juice = Math.max(0, this._juice - 0.83);
				this._canCharge = false;
			} else {
				this.resetTarget();
			}
			return true;
		}

		// Try to pick a new target
		const scene = game.world().scene();
		const mouse = input.mouse;
		const ray = game.lakitu().rayTo(new BABYLON.Vector3(mouse.x, mouse.y, 0));
		const raycasts = scene.multiPickWithRay(ray);

		for (let raycast of raycasts) {
			if (raycast.hit && raycast.pickedMesh.metadata && raycast.pickedMesh.metadata.entityId) {
				let [target, found] = game.entities().getEntity(raycast.pickedMesh.metadata.entityId);

				if (!found) { continue; }

				let valid = false;
				for (let type of target.allTypes()) {
					if (BirdBrain._pickableTypes.has(type)) {
						valid = true;
						break;
					}
				}

				if (!valid) { continue; }

				if (target.getAttribute(AttributeType.BRAINED)) {
					continue;
				}

				this.resetTarget(target.id());
				return true;
			}
		}

		return false;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this._canCharge) {
			this._juice = Math.min(100, this._juice + 1.6);
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
				let profile = target.getProfile();
				profile.setAcc({x: 0, y: GameGlobals.gravity });
				profile.clearMaxSpeed();
				MATTER.Body.setDensity(profile.body(), profile.body().density / BirdBrain._densityAdjustment);
				target.setAttribute(AttributeType.BRAINED, false);
			}
		}

		if (id) {
			let [target, hasTarget] = game.entities().getEntity(id);
			if (hasTarget) {
				let profile = target.getProfile();
				profile.setMaxSpeed({
					maxSpeed: { x: 5, y: 5},
				});
				MATTER.Body.setDensity(profile.body(), BirdBrain._densityAdjustment * profile.body().density);

				target.setAttribute(AttributeType.BRAINED, true);

				this._targetId.set(id);
			}
		} else {
			this._targetId.clear();
		}

		if (!this._usageTimer.hasTimeLeft()) {
			this._usageTimer.start(500, () => {
				this._canCharge = true;
			});
		}
	}
}