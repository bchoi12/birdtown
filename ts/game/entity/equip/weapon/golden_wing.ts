import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Bullet } from 'game/entity/projectile/bullet'
import { Weapon, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { SoundFactory } from 'game/factory/sound_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec3 } from 'util/vector'

export class GoldenWing extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.GOLDEN_WING, options);

		this.soundPlayer().registerSound(SoundType.WING_CANNON);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.MEDIUM; }
	override reloadType() : ReloadType { return ReloadType.RAISE; }
	override meshType() : MeshType { return MeshType.GOLDEN_WING; }
	override hudType() : HudType { return HudType.ORBS; }


	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();

		const spreadDeg = this.getStat(StatType.SPREAD);
		const ammo = this.bursts();

		let dir = this.getDir();
		if (ammo % 2 === 0) {
			if (ammo % 4 === 0) {
				dir.rotateDeg(spreadDeg / 2);
			} else {
				dir.rotateDeg(-spreadDeg / 2);
			}
		}

		this.addEntity(EntityType.STICKY_ORB, this.getProjectileOptions(pos, dir));
		this.soundPlayer().playFromEntity(SoundType.WING_CANNON, this.owner());
	}
}
