import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { Timer} from 'util/timer'
import { Vec2 } from 'util/vector'

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

	protected _weaponState : WeaponState;
	protected _shotConfig : ShotConfig;
	protected _burstTimer : Timer;
	protected _reloadTimer : Timer;

	protected _shoot : BABYLON.TransformNode;

	protected _model : Model;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.WEAPON);

		this._weaponState = WeaponState.READY;
		this._shotConfig = {
			bursts: 1,
			reloadTime: 1000,
		};
		this._burstTimer = this.newTimer({ canInterrupt: false });
		this._reloadTimer = this.newTimer({ canInterrupt: false });

		this._shoot = null;

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
							this._shoot = node;
						}
					});

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	abstract meshType() : MeshType;
	shootNode() : BABYLON.TransformNode { return this._shoot !== null ? this._shoot : this._model.mesh(); }
	reloadTimeLeft() : number { return this._reloadTimer.timeLeft(); }

	charged() : boolean { return false; }
	abstract shotConfig() : ShotConfig;
	abstract shoot() : void;
	abstract reload() : void;

	override update(stepData : StepData) : void {
		super.update(stepData);

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
				this.shoot();
				this._shotConfig.bursts--;

				if (this._shotConfig.bursts > 0) {
					this._burstTimer.start(this._shotConfig.burstTime);
				} else {
					this.reload();
					this._weaponState = WeaponState.RELOADING;
					this._reloadTimer.start(this._shotConfig.reloadTime);
				}
			}
		}
	}
}
