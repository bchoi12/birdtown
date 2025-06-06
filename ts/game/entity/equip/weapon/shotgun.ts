import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Bullet } from 'game/entity/projectile/bullet'
import { Weapon, WeaponConfig, WeaponState, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'

import { HudType } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Shotgun extends Weapon {

	private static readonly _bursts = 2;
	private static readonly _burstBullets = 4;
	private static readonly _spreadDeg = 22;
	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 220],
			[WeaponState.RELOADING, 1100],
		]),
		bursts: Shotgun._bursts,
	};
	private static readonly _bulletTTL = 440;

	constructor(options : EntityOptions) {
		super(EntityType.SHOTGUN, options);

		this.soundPlayer().registerSound(SoundType.BLAST);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override meshType() : MeshType { return MeshType.SHOTGUN; }
	override reloadType() : ReloadType { return ReloadType.RAISE; }
	override reloadSound() : SoundType { return SoundType.QUICK_RELOAD; }

	override weaponConfig() : WeaponConfig { return Shotgun._config; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();

		const unitDir = this.getDir();

		let vel = unitDir.clone().scale(0.65);
		const angle = vel.angleRad();
		vel.rotateDeg(-Shotgun._spreadDeg / 2);

		for (let i = 0; i < Shotgun._burstBullets; ++i) {
			this.addEntity(EntityType.PELLET, {
				ttl: Shotgun._bulletTTL,
				associationInit: {
					owner: this.owner(),
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

		let recoil = unitDir.clone().negate().scale(this.bursts() === 0 ? 0.5 : 0.1);
		this.owner().addForce(recoil);

		this.soundPlayer().playFromEntity(SoundType.BLAST, this.owner());
	}
}
