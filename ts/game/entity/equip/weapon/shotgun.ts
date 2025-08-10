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
import { StepData } from 'game/game_object'

import { HudType } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Shotgun extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.SHOTGUN, options);

		this.soundPlayer().registerSound(SoundType.BLAST);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override meshType() : MeshType { return MeshType.SHOTGUN; }
	override reloadType() : ReloadType { return ReloadType.RAISE; }
	override reloadSound() : SoundType { return SoundType.QUICK_RELOAD; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const spreadDeg = this.getStat(StatType.SPREAD);
		const unitDir = this.getDir();
		const burstBullets = this.getStat(StatType.BURST_BULLETS);

		let dir = unitDir.clone();
		dir.rotateDeg(-spreadDeg / 2);
		for (let i = 0; i < burstBullets; ++i) {
			this.addEntity(EntityType.PELLET, this.getProjectileOptions(pos, dir, dir.angleRad()));

			if (i < burstBullets - 1) {
				dir.rotateDeg(spreadDeg / (burstBullets - 1));
			}
		}

		let recoil = this.getStat(StatType.FORCE);
		if (this.bursts() !== 0) {
			recoil *= 0.2;
		}

		let recoilForce = unitDir.clone().negate().scale(recoil);
		this.owner().addForce(recoilForce);

		this.soundPlayer().playFromEntity(SoundType.BLAST, this.owner());
	}
}
