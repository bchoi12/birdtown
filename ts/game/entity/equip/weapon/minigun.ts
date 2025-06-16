
import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Weapon, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { MeshType, SoundType, StatType } from 'game/factory/api'

import { HudType, HudOptions } from 'ui/api'

import { Vec2, Vec3 } from 'util/vector'

export class Minigun extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.MINIGUN, options);

		this.soundPlayer().registerSound(SoundType.GATLING);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.MEDIUM; }
	override reloadType() : ReloadType { return ReloadType.RECOIL_BACK; }
	override meshType() : MeshType { return MeshType.MINIGUN; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();

		const spreadDeg = this.getStat(StatType.SPREAD);
		const ammo = this.ammo();
		const burstBullets = this.getStat(StatType.BURST_BULLETS);

		let dir = this.getDir();
		if (ammo % 2 === 0) {
			if (ammo % 4 === 0) {
				dir.rotateDeg(spreadDeg / 2);
			} else {
				dir.rotateDeg(-spreadDeg / 2);
			}
		}
		this.addEntity(EntityType.CALIBER, this.getProjectileOptions(pos, dir, dir.angleRad()));

		this.soundPlayer().playFromEntity(SoundType.GATLING, this.owner());
	}
}
