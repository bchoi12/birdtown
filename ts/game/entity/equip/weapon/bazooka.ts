import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Rocket } from 'game/entity/projectile/rocket'
import { Weapon, WeaponConfig, WeaponState, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Bazooka extends Weapon {

	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 500],
			[WeaponState.RELOADING, 1000],
		]),
		bursts: 1,
	};
	private static readonly _rocketTTL = 650;

	constructor(options : EntityOptions) {
		super(EntityType.BAZOOKA, options);

		this.soundPlayer().registerSound(SoundType.ROCKET);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override hudType() : HudType { return HudType.ROCKET; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override reloadType() : ReloadType { return ReloadType.DISLOCATE; }
	override meshType() : MeshType { return MeshType.BAZOOKA; }

	override weaponConfig() : WeaponConfig {
		return Bazooka._config;
	}

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const unitDir = this.getDir();

		let vel = unitDir.clone().scale(0.1);
		let acc = unitDir.clone().scale(1.6);
		let [rocket, hasRocket] = this.addEntity<Rocket>(EntityType.ROCKET, {
			ttl: Bazooka._rocketTTL,
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: pos,
				vel: vel,
				acc: acc,
			},
		});

		let recoil = unitDir.clone().negate().scale(0.75);
		this.owner().addForce(recoil);

		this.soundPlayer().playFromEntity(SoundType.ROCKET, this.owner());
	}
}
