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
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Pistol extends Weapon {

	private static readonly _bursts = 3;
	private static readonly _chargeBursts = 6;
	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 225],
			[WeaponState.RELOADING, 1000],
		]),
		bursts: Pistol._bursts,
	};
	private static readonly _chargeConfig = {
		times: new Map([
			[WeaponState.FIRING, 100],
			[WeaponState.RELOADING, 1500],
		]),
		bursts: Pistol._chargeBursts,
	};

	private static readonly _chargedThreshold = 1000;
	private static readonly _bulletTTL = 550;

	constructor(options : EntityOptions) {
		super(EntityType.PISTOL, options);

		this.soundPlayer().registerSound(SoundType.PISTOL);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.WHIP; }
	override meshType() : MeshType { return MeshType.PISTOL; }
	override reloadSound() : SoundType { return SoundType.QUICK_RELOAD; }

	override chargedThreshold() : number { return Pistol._chargedThreshold; }

	override weaponConfig() : WeaponConfig {
		return this.charged() ? Pistol._chargeConfig : Pistol._config;
	}

	override shoot(stepData : StepData) : void {
		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());

		const unitDir = this.getDir();

		let vel = unitDir.clone().setLength(0.9);
		this.addEntity<Bullet>(EntityType.BULLET, {
			ttl: Pistol._bulletTTL,
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

		if (this.charged()) {
			let recoil = unitDir.clone().negate().scale(0.2);
			this.owner().profile().addForce(recoil);
		}

		this.soundPlayer().playFromEntity(SoundType.PISTOL, this.owner());
	}

}
