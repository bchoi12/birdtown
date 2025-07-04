import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Weapon, WeaponState, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MaterialType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { Fns } from 'util/fns'
import { Vec, Vec3 } from 'util/vector'

export abstract class GatlingBase extends Weapon {
	protected static readonly _spinnerName = "spinner";

	protected static readonly _maxRotateRate = 5 * Math.PI;

	protected _projectileType : EntityType;
	protected _soundType : SoundType;
	protected _maxSpeed : Vec;
	protected _recoilVel : Vec;
	protected _rotateRad : number;
	protected _spinner : BABYLON.Mesh;

	constructor(type : EntityType, options : EntityOptions) {
		super(type, options);

		this.addType(EntityType.GATLING);

		this._projectileType = EntityType.CALIBER;
		this._soundType = SoundType.GATLING;
		this._maxSpeed = { x: 0.6, y: 0.4 };
		this._recoilVel = { x: 3, y: 8};
		this._rotateRad = 0;
		this._spinner = null;

		// Override parent
		this._interruptible = true;
	}

	override initialize() : void {
		super.initialize();

		this.soundPlayer().registerSound(this._soundType);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.MEDIUM; }
	override reloadType() : ReloadType { return ReloadType.VERTICAL; }
	override reloadSound() : SoundType { return SoundType.QUICK_RELOAD; }
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

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const unitDir = this.getDir();

		this.addEntity(this._projectileType, this.getProjectileOptions(pos, unitDir, unitDir.angleRad()));

		let recoilVel = unitDir.clone().negate().mult(this._recoilVel).scale(16 / 1000);
		let ownerProfile = this.owner().profile();
		if (Math.sign(recoilVel.x) === Math.sign(ownerProfile.vel().x)) {
			recoilVel.x *= Math.abs(ownerProfile.vel().x / this._maxSpeed.x);
		}
		recoilVel.y = this.computeVerticalAcc(recoilVel, ownerProfile.vel());
		ownerProfile.addVel(recoilVel);

		this.soundPlayer().playFromEntity(this._soundType, this.owner());
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
			this._rotateRad -= Gatling._maxRotateRate * millis / (2 * this.getStat(StatType.REV_TIME));
			this._rotateRad = Math.max(0, this._rotateRad);
		}

		this._spinner.addRotation(0, 0, this._rotateRad * millis / 1000);
	}

	protected computeVerticalAcc(recoilVel : Vec, ownerVel : Vec) : number {
		// Handle y velocity like jetpack to allow hovering, but not jump boosting.
		return recoilVel.y * Fns.clamp(0, Math.abs(this._maxSpeed.y - ownerVel.y) / (2 * this._maxSpeed.y), 1);
	}
}


export class Gatling extends GatlingBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.GATLING, entityOptions);
	}
}