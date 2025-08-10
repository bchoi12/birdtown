
import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Weapon, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec2, Vec3 } from 'util/vector'

export class LaserGun extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.LASER_GUN, options);

		this.soundPlayer().registerSound(SoundType.BOLT);
		this.soundPlayer().registerSound(SoundType.CHARGED_BOLT);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.MEDIUM; }
	override reloadType() : ReloadType { return ReloadType.RECOIL_BACK; }
	override meshType() : MeshType { return MeshType.LASER_GUN; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const charged = this.charged();
		const pos = this.shootPos();
		const unitDir = this.getDir();

		this.addEntity(charged ? EntityType.CHARGED_BOLT : EntityType.BOLT, this.getProjectileOptions(pos, unitDir, unitDir.angleRad()));
		this.soundPlayer().playFromEntity(charged ? SoundType.CHARGED_BOLT : SoundType.BOLT, this.owner());
	}
}
