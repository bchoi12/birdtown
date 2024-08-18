import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { ParticleCube } from 'game/entity/particle/particle_cube'
import { MaterialType, MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { RateLimiter } from 'util/rate_limiter'
import { Timer } from 'util/timer'
import { Vec2, Vec3 } from 'util/vector'

enum WeaponState {
	UNKNOWN,

	READY,
	BURSTING,
	RELOADING,
}

export type ShotConfig = {
	burstTime? : number;
	delay? : number;

	bursts : number;
	reloadTime : number;
}

export abstract class Weapon extends Equip<Player> {

	private static readonly _shootNodeName = "shoot";
	private static readonly _chargeInterval = 250;

	protected _weaponState : WeaponState;
	protected _shotConfig : ShotConfig;
	protected _burstTimer : Timer;
	protected _reloadTimer : Timer;
	protected _chargeRateLimiter : RateLimiter;

	protected _shootNode : BABYLON.TransformNode;

	protected _model : Model;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.WEAPON);

		this._weaponState = WeaponState.READY;
		this._shotConfig = this.shotConfig();
		this._burstTimer = this.newTimer({ canInterrupt: false });
		this._reloadTimer = this.newTimer({ canInterrupt: false });
		this._chargeRateLimiter = new RateLimiter(Weapon._chargeInterval);

		this._shootNode = null;

		this.addProp<WeaponState>({
			has: () => { return this._weaponState !== WeaponState.UNKNOWN; },
			export: () => { return this._weaponState; },
			import: (obj : WeaponState) => { this._weaponState = obj; },
		})

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(this.meshType(), (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];

					result.transformNodes.forEach((node : BABYLON.TransformNode) => {
						if (node.name === Weapon._shootNodeName) {
							this._shootNode = node;
						}
					});

					if (this._shootNode === null) {
						console.error("Error: no shoot node for %s", this.name());
					}

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	abstract meshType() : MeshType;
	shootNode() : BABYLON.TransformNode { return this._shootNode !== null ? this._shootNode : this._model.mesh(); }
	reloadMillis() : number { return this._reloadTimer.millisLeft(); }

	charged() : boolean { return false; }
	abstract shotConfig() : ShotConfig;
	abstract shoot(stepData : StepData) : void;
	onReload() : void {}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._weaponState === WeaponState.RELOADING) {
			// TODO: click sound on key press
			if (this.getCounter(CounterType.CHARGE) > 0) {
				this.setCounter(CounterType.CHARGE, 0);
			}

			if (!this._reloadTimer.hasTimeLeft()) {
				this._weaponState = WeaponState.READY;
			}
		}

		if (this._weaponState === WeaponState.READY) {
			const charging = this.getAttribute(AttributeType.CHARGING) && !this.charged();
			if (this.key(KeyType.MOUSE_CLICK, KeyState.DOWN) && !charging) {
				this._weaponState = WeaponState.BURSTING;
				this._shotConfig = this.shotConfig();

				if (this._shotConfig.delay) {
					this._burstTimer.start(this._shotConfig.delay);
				}
			}
		}

		if (this._weaponState === WeaponState.BURSTING) {
			if (!this._burstTimer.hasTimeLeft()) {
				this.shoot(stepData);
				this.recordUse();
				this._shotConfig.bursts--;

				if (this._shotConfig.bursts > 0) {
					this._burstTimer.start(this._shotConfig.burstTime);
				} else {
					this._weaponState = WeaponState.RELOADING;
					this._reloadTimer.start(this._shotConfig.reloadTime);
					this.onReload();
				}
			}
		}

		if (this.getAttribute(AttributeType.CHARGING)) {
			if (this._chargeRateLimiter.check(millis)) {
				const offset = Vec2.unitFromDeg(Math.random() * 360).scale(0.4);
				const pos = Vec3.fromBabylon3(this._shootNode.getAbsolutePosition());

				// TODO: don't hardcode 1000 as max
				const size = 0.05 + 0.45 * (Math.min(1000, this.getCounter(CounterType.CHARGE)) / 1000);
				const [cube, hasCube] = this.addEntity<ParticleCube>(EntityType.PARTICLE_ENERGY_CUBE, {
					offline: true,
					ttl: 1.5 * Weapon._chargeInterval,
					profileInit: {
						pos: pos.clone().add(offset),
						vel: {
							x: 0.05 * offset.y,
							y: 0.05 * offset.x,
						},
						angle: 0,
					},
					modelInit: {
						transforms: {
							translate: { z: pos.z + size / 2 },
							scale: { x: size, y: size, z: size },
						},
						materialType: MaterialType.BOLT_ORANGE,
					}
				});

				if (hasCube) {
					cube.profile().setAngularVelocity(-0.1 * Math.sign(offset.x));
					cube.overrideUpdateFn((stepData : StepData, particle : ParticleCube) => {
						particle.profile().moveTo(pos, {
							millis: stepData.millis,
							posEpsilon: 0.05,
							maxAccel: 0.05,
						});
						particle.model().scaling().setScalar(size * (1 - particle.ttlElapsed()));
					});
				}
			}
		}
	}
}
