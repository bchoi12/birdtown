import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Bullet } from 'game/entity/projectile/bullet'
import { Weapon, WeaponConfig, WeaponState, RecoilType } from 'game/entity/equip/weapon'
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
			[WeaponState.FIRING, 160],
			[WeaponState.RELOADING, 900],
		]),
		bursts: Pistol._bursts,
	};
	private static readonly _chargeConfig = {
		times: new Map([
			[WeaponState.FIRING, 100],
			[WeaponState.RELOADING, 900],
		]),
		bursts: Pistol._chargeBursts,
	};

	private static readonly _chargedThreshold = 1000;
	private static readonly _chargedBulletTTL = 550;
	private static readonly _bulletTTL = 450;

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

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();

		const unitDir = this.getDir();

		let vel = unitDir.clone().scale(this.charged() ? 0.9 : 0.85);
		this.addEntity<Bullet>(EntityType.BULLET, {
			ttl: this.charged() ? Pistol._chargedBulletTTL : Pistol._bulletTTL,
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: pos,
				vel: vel,
				angle: vel.angleRad(),
			},
		});

		if (this.charged()) {
			let recoil = unitDir.clone().negate().scale(0.2);
			this.owner().addForce(recoil);
		}

		this.soundPlayer().playFromEntity(SoundType.PISTOL, this.owner());
	}

}
