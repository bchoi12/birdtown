import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { SoundPlayer } from 'game/component/sound_player'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Bolt } from 'game/entity/projectile/bolt'
import { Weapon, ShotConfig } from 'game/entity/equip/weapon'
import { MaterialType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { CounterOptions, KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Fns } from 'util/fns'
import { Vec, Vec3 } from 'util/vector'

export class Gatling extends Weapon {

	private static readonly _chargedThreshold = 1000;
	private static readonly _projectileTTL = 550;
	private static readonly _spinnerName = "spinner";

	private static readonly _recoilVel = { x: 3, y: 8};
	private static readonly _maxSpeed = { x: 0.6, y: 0.4 };

	private _spinner : BABYLON.Mesh;

	private _soundPlayer : SoundPlayer;

	constructor(options : EntityOptions) {
		super(EntityType.GATLING, options);

		this._spinner = null;

		this._soundPlayer = this.addComponent<SoundPlayer>(new SoundPlayer());
		this._soundPlayer.registerSound(SoundType.LASER, SoundType.LASER);
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

	override shotConfig() : ShotConfig {
		return {
			bursts: 1,
			reloadTime: 80,
		};
	}

	override shoot(stepData : StepData) : void {
		const millis = stepData.millis;

		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = this.inputDir().clone().normalize();

		let vel = unitDir.clone().scale(0.7);
		let [bolt, hasBolt] = this.addEntity<Bolt>(EntityType.PELLET, {
			ttl: Gatling._projectileTTL,
			associationInit: {
				owner: this.owner(),
			},
			modelInit: {
				transforms: {
					translate: { z: pos.z },
				},
			},
			profileInit: {
				pos: pos,
				vel: vel,
				angle: vel.angleRad(),
			},
		});

		let recoilVel = unitDir.clone().negate().mult(Gatling._recoilVel).scale(millis / 1000);
		let ownerProfile = this.owner().profile();
		if (Math.sign(recoilVel.x) === Math.sign(ownerProfile.vel().x)) {
			recoilVel.x *= Math.abs(ownerProfile.vel().x / Gatling._maxSpeed.x);
		}
		recoilVel.y = this.computeVerticalAcc(recoilVel, ownerProfile.vel());
		ownerProfile.addVel(recoilVel);

		this._soundPlayer.playFromEntity(SoundType.LASER, this.owner());
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this._spinner !== null) {
			this._spinner.addRotation(0, 0, 7 * Math.PI * millis / 1000);
		}
	}

	override getCounts() : Map<CounterType, CounterOptions> {
		let counts = super.getCounts();
		counts.set(CounterType.CHARGE, {
			percentGone: 0,
			text: "N/A",
			color: ColorFactory.boltDarkOrange.toString(),
		});
		return counts;
	}

	private computeVerticalAcc(recoilVel : Vec, ownerVel : Vec) : number {
		// Handle y velocity like jetpack to allow hovering, but not jump boosting.
		return recoilVel.y * Fns.clamp(0, Math.abs(Gatling._maxSpeed.y - ownerVel.y) / (2 * Gatling._maxSpeed.y), 1);
	}
}
