import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MaterialType, MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { Timer } from 'util/timer'
import { Vec2, Vec3 } from 'util/vector'

export enum WeaponState {
	UNKNOWN,

	IDLE,
	REVVING,
	FIRING,
	RELOADING,
}

export type WeaponConfig = {
	times : Map<WeaponState, number>;
	bursts : number;

	// If true, do not reload until the clip is empty
	allowPartialClip? : boolean;

	// If true, stop firing when mouse releases even if clip is not empty
	interruptable? : boolean;
}

export abstract class Weapon extends Equip<Player> {

	private static readonly _shootNodeName = "shoot";

	protected _weaponState : WeaponState;
	protected _stateTimer : Timer;
	protected _bursts : number;

	protected _shootNode : BABYLON.TransformNode;

	protected _model : Model;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.WEAPON);

		this._weaponState = WeaponState.IDLE;
		this._stateTimer = this.newTimer({ canInterrupt: true });
		this._bursts = this.weaponConfig().bursts;

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
					this.processMesh(mesh, result);
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	abstract meshType() : MeshType;
	processMesh(mesh : BABYLON.Mesh, result : LoadResult) : void {
		result.transformNodes.forEach((node : BABYLON.TransformNode) => {
			if (node.name === Weapon._shootNodeName) {
				this._shootNode = node;
			}
		});

		if (this._shootNode === null) {
			console.error("Error: no shoot node for %s", this.name());
		}
	}
	shootNode() : BABYLON.TransformNode { return this._shootNode !== null ? this._shootNode : this._model.mesh(); }
	reloadMillis() : number { return this._weaponState === WeaponState.RELOADING ? this._stateTimer.millisLeft() : 0; }

	weaponState() : WeaponState { return this._weaponState; }
	abstract weaponConfig() : WeaponConfig;
	bursts() : number { return this._bursts; }
	timer() : Timer { return this._stateTimer; }
	getTime(state : WeaponState) : number {
		const config = this.weaponConfig();
		if (config.times.has(state)) {
			return config.times.get(state);
		}
		return 0;
	}

	charged() : boolean { return false; }

	protected firing() : boolean {
		const charging = this.getAttribute(AttributeType.CHARGING) && !this.charged();
		return this.key(KeyType.MOUSE_CLICK, KeyState.DOWN) && !charging;
	}
	protected fire(stepData : StepData) : void {
		if (this._bursts <= 0) {
			return;
		}

		this.shoot(stepData);
		this.recordUse();
		this._bursts--;
	}
	abstract shoot(stepData : StepData) : void;
	onReload() : void {}
	quickReload(millis? : number) : void {
		this._bursts = this.weaponConfig().bursts;
		if (millis <= 0) {
			this.setWeaponState(WeaponState.IDLE);
			this._stateTimer.reset();
		} else {
			this.setWeaponState(WeaponState.RELOADING);
			this._stateTimer.start(millis);
		}
	}

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

			if (!this.weaponConfig().allowPartialClip) {
				this._bursts = Math.max(this._bursts, Math.floor(this._stateTimer.percentElapsed() * this.weaponConfig().bursts));
			}
			if (!this._stateTimer.hasTimeLeft()) {
				this.setWeaponState(WeaponState.IDLE);
				this._bursts = this.weaponConfig().bursts;
			}
		}

		if (this._weaponState === WeaponState.IDLE) {
			if (this.firing()) {
				this.setWeaponState(WeaponState.REVVING);
			}
		}

		if (this._weaponState === WeaponState.REVVING) {
			if (!this._stateTimer.hasTimeLeft()) {
				// Reset again in case the config changed.
				if (!this.weaponConfig().allowPartialClip) {
					this._bursts = this.weaponConfig().bursts;
				}

				this.fire(stepData);
				this.setWeaponState(WeaponState.FIRING);
			}
		}

		if (this._weaponState === WeaponState.FIRING) {
			if (this._bursts <= 0) {
				this.setWeaponState(WeaponState.RELOADING);
			} else if (!this.firing() && this.weaponConfig().interruptable) {
				if (this.weaponConfig().allowPartialClip) {
					this.setWeaponState(WeaponState.IDLE);
				} else {
					this.setWeaponState(WeaponState.RELOADING);
				}
			} else if (!this._stateTimer.hasTimeLeft()) {
				this.fire(stepData);

				if (this._bursts > 0) {
					this._stateTimer.start(this.getTime(WeaponState.FIRING));
				} else {
					this.setWeaponState(WeaponState.RELOADING);
				}
			}
		}
	}

	private setWeaponState(state : WeaponState) : void {
		if (this._weaponState === state) {
			return;
		}

		this._weaponState = state;
		const time = this.getTime(this._weaponState);
		if (time > 0) {
			this._stateTimer.start(time);
		} else {
			this._stateTimer.reset();
		}

		switch (this._weaponState) {
		case WeaponState.RELOADING:
			this.onReload();
			break;
		}
	}
}
