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

import { HudType } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Shotgun extends Weapon {

	private static readonly _bursts = 2;
	private static readonly _burstBullets = 4;
	private static readonly _spreadDeg = 15;
	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 200],
			[WeaponState.RELOADING, 1250],
		]),
		bursts: Shotgun._bursts,
	};
	private static readonly _bulletTTL = 500;

	constructor(options : EntityOptions) {
		super(EntityType.SHOTGUN, options);

		this.soundPlayer().registerSound(SoundType.PISTOL);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override meshType() : MeshType { return MeshType.SHOTGUN; }
	override reloadSound() : SoundType { return SoundType.QUICK_RELOAD; }

	override weaponConfig() : WeaponConfig { return Shotgun._config; }

	override shoot(stepData : StepData) : void {
		const pos = this.shootPos();

		const unitDir = this.getDir();

		let vel = unitDir.clone().setLength(0.6);
		vel.rotateDeg(-Shotgun._spreadDeg / 2);

		for (let i = 0; i < Shotgun._burstBullets; ++i) {
			this.addEntity(EntityType.PELLET, {
				ttl: Shotgun._bulletTTL,
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

			if (i < Shotgun._burstBullets - 1) {
				vel.rotateDeg(Shotgun._spreadDeg / (Shotgun._burstBullets - 1));
			}
		}
		let recoil = unitDir.clone().negate().scale(0.3);
		this.owner().profile().addForce(recoil);

		this.soundPlayer().playFromEntity(SoundType.PISTOL, this.owner());
	}
}
