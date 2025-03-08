import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Bullet } from 'game/entity/projectile/bullet'
import { Weapon, WeaponConfig, WeaponState, RecoilType } from 'game/entity/equip/weapon'
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
			[WeaponState.RELOADING, 1200],
		]),
		bursts: WingCannon._bursts,
	};
	private static readonly _chargeConfig = {
		times: new Map([
			[WeaponState.FIRING, 1000],
			[WeaponState.RELOADING, 800],
		]),
		bursts: WingCannon._chargeBursts,
	};

	private static readonly _chargedThreshold = 1000;
	private static readonly _orbTTL = 450;

	constructor(options : EntityOptions) {
		super(EntityType.WING_CANNON, options);

		this.soundPlayer().registerSound(SoundType.WING_CANNON);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.WHIP; }
	override meshType() : MeshType { return MeshType.WING_CANNON; }
	override hudType() : HudType { return HudType.ORBS; }

	override chargedThreshold() : number { return WingCannon._chargedThreshold; }

	override weaponConfig() : WeaponConfig {
		return this.charged() ? WingCannon._chargeConfig : WingCannon._config;
	}

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();

		const unitDir = this.getDir();

		if (this.charged()) {
			this.addEntity(EntityType.LASER, {
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
			let vel = unitDir.clone().scale(0.8);
			this.addEntity(EntityType.ORB, {
				ttl: WingCannon._orbTTL,
				associationInit: {
					owner: this.owner(),
				},
				profileInit: {
					pos: pos,
					vel: vel,
					angle: vel.angleRad(),
				},
			});
			this.soundPlayer().playFromEntity(SoundType.WING_CANNON, this.owner());
		}
	}
}
