import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AssociationType, AttributeType, ComponentType, CounterType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Bolt } from 'game/entity/projectile/bolt'
import { Weapon } from 'game/entity/equip/weapon'
import { MeshType } from 'game/factory/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Vec3 } from 'util/vector'

export class Sniper extends Weapon {

	private static readonly _chargedThreshold = 1000;
	private static readonly _boltTTL = 750;
	private static readonly _lookPanTime = 200;

	private _look : Vec3;
	private _lookWeight : number;

	constructor(options : EntityOptions) {
		super(EntityType.SNIPER, options);

		this._look = Vec3.zero();
		this._lookWeight = 0;

		this.setAttribute(AttributeType.READY, true);
	}

	override displayName() : string { return "thonker"; }
	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.SMALL; }
	override meshType() : MeshType { return MeshType.SNIPER; }

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (!this._model.hasMesh()) {
			return;
		}

		const charged = this.getCounter(CounterType.CHARGE) >= Sniper._chargedThreshold;
		if (this.getAttribute(AttributeType.CHARGING)) {
			if (this._look.isZero()) {
				this._look = Vec3.fromVec(this.inputDir()).normalize().scale(8);
				this._lookWeight = 0;
			}
			this._lookWeight += millis;

			if (!charged) {
				return;
			}
		} else {
			this._look.scale(0);
			this._lookWeight = Math.max(0, this._lookWeight - 3 * millis);
		}

		if (!this.key(KeyType.MOUSE_CLICK, KeyState.DOWN) || !this._attributes.getAttribute(AttributeType.READY)) {
			return;
		}

		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = this.inputDir().clone().normalize();

		let vel = unitDir.clone().scale(charged ? 1 : 0.7);
		let [bolt, hasBolt] = this.addEntity<Bolt>(EntityType.BOLT, {
			ttl: Sniper._boltTTL,
			associationInit: {
				owner: this,
			},
			modelInit: {
				transforms: {
					translate: { z: pos.z },
				}
			},
			profileInit: {
				pos: pos,
				vel: vel,
				angle: vel.angleRad(),
			},
		});

		if (hasBolt) {
			if (charged) {
				bolt.setAttribute(AttributeType.CHARGED, true);
				bolt.profile().setScaleFactor(1.5);
			}

			this.recordUse();
		}

		if (charged) {
			this.setCounter(CounterType.CHARGE, 0);
			this.reload(500);
		} else {
			this.reload(125);
		}
	}

	override getCounts() : Map<CounterType, number> {
		let counts = super.getCounts();
		counts.set(CounterType.CHARGE, Math.floor(this.chargePercent()));
		return counts;
	}

	override cameraOffset() : Vec3 {
		if (!this.getAttribute(AttributeType.CHARGING)) {
			return super.cameraOffset();
		}
		const n = Math.min(1, this._lookWeight / Sniper._lookPanTime);
		return this._look.clone().scale(n * (2 - n));
	}

	private chargePercent() : number {
		return Math.min(100, this.getCounter(CounterType.CHARGE) / 10);
	}
}
