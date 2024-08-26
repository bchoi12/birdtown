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
import { MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'

import { CounterOptions, KeyType, KeyState } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Pistol extends Weapon {

	private static readonly _bursts = 3;
	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 275],
			[WeaponState.RELOADING, 1000],
		]),
		bursts: Pistol._bursts,
		interruptable: true,
		allowPartialClip: true,
	};
	private static readonly _bulletTTL = 800;

	private _soundPlayer : SoundPlayer;

	constructor(options : EntityOptions) {
		super(EntityType.PISTOL, options);

		this._soundPlayer = this.addComponent<SoundPlayer>(new SoundPlayer());
		this._soundPlayer.registerSound(SoundType.PISTOL, SoundType.PISTOL);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.WHIP; }
	override meshType() : MeshType { return MeshType.PISTOL; }

	override weaponConfig() : WeaponConfig { return Pistol._config; }

	override shoot(stepData : StepData) : void {
		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());

		let vel = this.inputDir().clone().setLength(0.9);
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

		this._soundPlayer.playFromEntity(SoundType.PISTOL, this.owner());
	}

	override getCounts() : Map<CounterType, CounterOptions> {
		let counts = super.getCounts();
		counts.set(CounterType.BULLETS, {
			percentGone: 1 - this.bursts() / Pistol._bursts,
			text: "" + this.bursts(),
			color: ColorFactory.pelletYellow.toString(),
		});
		return counts;
	}

}
