import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Bullet } from 'game/entity/projectile/bullet'
import { Weapon, WeaponConfig, WeaponState } from 'game/entity/equip/weapon'
import { ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { SoundFactory } from 'game/factory/sound_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec3 } from 'util/vector'

export class WingCannon extends Weapon {

	private static readonly _bursts = 5;
	private static readonly _chargeBursts = 1;
	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 100],
			[WeaponState.RELOADING, 1500],
		]),
		bursts: WingCannon._bursts,
	};
	private static readonly _chargeConfig = {
		times: new Map([
			[WeaponState.FIRING, 1000],
			[WeaponState.RELOADING, 1500],
		]),
		bursts: WingCannon._chargeBursts,
	};

	private static readonly _chargedThreshold = 1000;
	private static readonly _laserTTL = 750;
	private static readonly _orbTTL = 450;
	private static readonly _orbSpeed = 0.85;

	constructor(options : EntityOptions) {
		super(EntityType.WING_CANNON, options);

		SoundFactory.load(SoundType.LASER);
		this.soundPlayer().registerSound(SoundType.CHARGED_BOLT);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.WHIP; }
	override meshType() : MeshType { return MeshType.WING_CANNON; }

	override chargedThreshold() : number { return WingCannon._chargedThreshold; }

	override weaponConfig() : WeaponConfig {
		return this.charged() ? WingCannon._chargeConfig : WingCannon._config;
	}

	override shoot(stepData : StepData) : void {
		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());

		const unitDir = this.getDir();

		if (this.charged()) {
			this.addEntity(EntityType.LASER, {
				ttl: WingCannon._laserTTL,
				associationInit: {
					owner: this.owner(),
				},
				profileInit: {
					pos: pos,
					vel: { x: 0, y: 0 },
					angle: unitDir.angleRad(),
				},
			});
		} else {
			let vel = unitDir.clone().setLength(WingCannon._orbSpeed);
			this.addEntity(EntityType.ORB, {
				ttl: WingCannon._orbTTL,
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
			this.soundPlayer().playFromEntity(SoundType.CHARGED_BOLT, this.owner());
		}
	}
}
