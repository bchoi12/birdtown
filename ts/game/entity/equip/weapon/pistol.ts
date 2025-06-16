import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Bullet } from 'game/entity/projectile/bullet'
import { Weapon, WeaponState, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MaterialType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Pistol extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.PISTOL, options);

		this.soundPlayer().registerSound(SoundType.PISTOL);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.WHIP; }
	override meshType() : MeshType { return MeshType.PISTOL; }
	override reloadType() : ReloadType { return ReloadType.SPIN; }
	override reloadSound() : SoundType { return SoundType.QUICK_RELOAD; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const unitDir = this.getDir();
		this.addEntity<Bullet>(EntityType.BULLET, this.getProjectileOptions(pos, unitDir, unitDir.angleRad()));

		if (this.charged()) {
			let recoil = unitDir.clone().negate().scale(this.getStat(StatType.CHARGED_FORCE));
			this.owner().addForce(recoil);
		}

		this.soundPlayer().playFromEntity(SoundType.PISTOL, this.owner());
	}

}
