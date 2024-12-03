import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Weapon, WeaponConfig, WeaponState, RecoilType } from 'game/entity/equip/weapon'
import { ColorType, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { Fns } from 'util/fns'
import { Vec, Vec3 } from 'util/vector'

export class Gatling extends Weapon {

	private static readonly _revTime = 360;
	private static readonly _bursts = 30;
	private static readonly _config = {
		times: new Map([
			[WeaponState.REVVING, Gatling._revTime],
			[WeaponState.FIRING, 83],
			[WeaponState.RELOADING, 500],
		]),
		bursts: Gatling._bursts,
		interruptable: true,
	};
	private static readonly _projectileTTL = 500;
	private static readonly _spinnerName = "spinner";

	private static readonly _recoilVel = { x: 3, y: 8};
	private static readonly _maxSpeed = { x: 0.6, y: 0.4 };
	private static readonly _maxRotateRate = 5 * Math.PI;

	private _rotateRad : number;
	private _spinner : BABYLON.Mesh;

	constructor(options : EntityOptions) {
		super(EntityType.GATLING, options);

		this._rotateRad = 0;
		this._spinner = null;

		this.soundPlayer().registerSound(SoundType.GATLING);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.MEDIUM; }
	override meshType() : MeshType { return MeshType.GATLING; }
	override processMesh(mesh : BABYLON.Mesh, result : LoadResult) : void {
		super.processMesh(mesh, result);

		result.meshes.forEach((mesh : BABYLON.Mesh) => {
			if (mesh.name === Gatling._spinnerName) {
				this._spinner = mesh;
			}
		});

		if (this._spinner === null) {
			console.error("Warning: no spinner found for %s", this.name());
		}
	}

	override weaponConfig() : WeaponConfig { return Gatling._config; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const unitDir = this.getDir();

		let vel = unitDir.clone().scale(0.8);
		this.addEntity(EntityType.CALIBER, {
			ttl: Gatling._projectileTTL,
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: pos,
				vel: vel,
				angle: vel.angleRad(),
			},
		});

		let recoilVel = unitDir.clone().negate().mult(Gatling._recoilVel).scale(16 / 1000);
		let ownerProfile = this.owner().profile();
		if (Math.sign(recoilVel.x) === Math.sign(ownerProfile.vel().x)) {
			recoilVel.x *= Math.abs(ownerProfile.vel().x / Gatling._maxSpeed.x);
		}
		recoilVel.y = this.computeVerticalAcc(recoilVel, ownerProfile.vel());
		ownerProfile.addVel(recoilVel);

		this.soundPlayer().playFromEntity(SoundType.GATLING, this.owner());
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this._spinner === null) {
			return;
		}

		if (this.weaponState() === WeaponState.REVVING) {
			this._rotateRad = this.timer().percentElapsed() * Gatling._maxRotateRate;
		} else if (this.weaponState() === WeaponState.FIRING) {
			this._rotateRad = Gatling._maxRotateRate;
		} else {
			this._rotateRad -= Gatling._maxRotateRate * millis / Gatling._revTime;
			this._rotateRad = Math.max(0, this._rotateRad);
		}

		this._spinner.addRotation(0, 0, this._rotateRad * millis / 1000);
	}

	private computeVerticalAcc(recoilVel : Vec, ownerVel : Vec) : number {
		// Handle y velocity like jetpack to allow hovering, but not jump boosting.
		return recoilVel.y * Fns.clamp(0, Math.abs(Gatling._maxSpeed.y - ownerVel.y) / (2 * Gatling._maxSpeed.y), 1);
	}
}
