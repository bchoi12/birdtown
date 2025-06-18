
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { GatlingBase } from 'game/entity/equip/weapon/gatling'
import { MeshType, SoundType } from 'game/factory/api'

import { HudType } from 'ui/api'

export class OrbCannon extends GatlingBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ORB_CANNON, entityOptions);

		this._soundType = SoundType.MACHINE_GUN;
		this._projectileType = EntityType.MINI_ORB;
	}

	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override meshType() : MeshType { return MeshType.ORB_CANNON; }
	override reloadSound() : SoundType { return SoundType.SCIFI_RELOAD; }
	override hudType() : HudType { return HudType.ORBS; }
}