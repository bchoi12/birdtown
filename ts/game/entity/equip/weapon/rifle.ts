
import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Weapon, WeaponState, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MaterialType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec2, Vec3 } from 'util/vector'

export class Rifle extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.RIFLE, options);

		this.soundPlayer().registerSound(SoundType.RIFLE);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override reloadType() : ReloadType { return ReloadType.RECOIL_RAISE; }
	override meshType() : MeshType { return MeshType.RIFLE; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const unitDir = this.getDir();

		this.addEntity(EntityType.CARTRIDGE, this.getProjectileOptions(pos, unitDir, unitDir.angleRad()));

		let recoil = unitDir.clone().negate().scale(this.getStat(this.charged() ? StatType.CHARGED_FORCE : StatType.FORCE));
		this.owner().addForce(recoil);

		this.soundPlayer().playFromEntity(SoundType.RIFLE, this.owner());
	}
}
