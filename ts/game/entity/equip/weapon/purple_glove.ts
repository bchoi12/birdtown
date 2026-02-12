
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Weapon, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { MaterialType, MeshType, SoundType, StatType } from 'game/factory/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { HudType } from 'ui/api'

import { defined } from 'util/common'
import { Vec3 } from 'util/vector'

export class PurpleGlove extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.PURPLE_GLOVE, options);

		this.soundPlayer().registerSound(SoundType.THROW);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override hudType() : HudType { return HudType.STAR; }
	override recoilType() : RecoilType { return RecoilType.THROW; }
	override reloadType() : ReloadType { return ReloadType.RUMMAGE; }
	override meshType() : MeshType { return MeshType.PURPLE_GLOVE; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		// Use static TTL for projectiles
		let projectileOptions = this.getProjectileOptions(this.shootPos(), this.getDir());
		projectileOptions.ttl = this.getStat(StatType.PROJECTILE_TTL);

		this.addEntity(EntityType.STAR, projectileOptions);
		this.soundPlayer().playFromEntity(SoundType.THROW, this.owner());
	}
}
