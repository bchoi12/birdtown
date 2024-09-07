import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { CounterType } from 'game/component/api'
import { SoundPlayer } from 'game/component/sound_player'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Bullet } from 'game/entity/projectile/bullet'
import { Weapon, WeaponConfig, WeaponState } from 'game/entity/equip/weapon'
import { ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'

import { CounterOptions, KeyType, KeyState } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Shotgun extends Weapon {

	private static readonly _bursts = 2;
	private static readonly _burstBullets = 4;
	private static readonly _spreadDeg = 15;
	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 200],
			[WeaponState.RELOADING, 1000],
		]),
		bursts: Shotgun._bursts,
	};
	private static readonly _bulletTTL = 500;

	private _soundPlayer : SoundPlayer;

	constructor(options : EntityOptions) {
		super(EntityType.SHOTGUN, options);

		this._soundPlayer = this.addComponent<SoundPlayer>(new SoundPlayer());
		this._soundPlayer.registerSound(SoundType.PISTOL, SoundType.PISTOL);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override meshType() : MeshType { return MeshType.SHOTGUN; }

	override weaponConfig() : WeaponConfig { return Shotgun._config; }

	override shoot(stepData : StepData) : void {
		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());

		const unitDir = this.inputDir();

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

		this._soundPlayer.playFromEntity(SoundType.PISTOL, this.owner());
	}

	override getCounts() : Map<CounterType, CounterOptions> {
		let counts = super.getCounts();
		counts.set(CounterType.BULLETS, {
			percentGone: 1 - this.bursts() / Shotgun._bursts,
			text: "" + this.bursts(),
			color: ColorFactory.color(ColorType.SHOOTER_YELLOW).toString(),
		});
		return counts;
	}

}
