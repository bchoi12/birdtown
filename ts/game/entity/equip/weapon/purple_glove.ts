
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Weapon, WeaponConfig, WeaponState, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { MaterialType, MeshType, SoundType } from 'game/factory/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { HudType } from 'ui/api'

import { defined } from 'util/common'
import { Vec3 } from 'util/vector'

export class PurpleGlove extends Weapon {

	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 150],
			[WeaponState.RELOADING, 750],
		]),
		bursts: 4,
	};
	private static readonly _starTTL = 1000;

	constructor(options : EntityOptions) {
		super(EntityType.PURPLE_GLOVE, options);

		this.soundPlayer().registerSound(SoundType.THROW);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override hudType() : HudType { return HudType.STAR; }
	override recoilType() : RecoilType { return RecoilType.THROW; }
	override reloadType() : ReloadType { return ReloadType.RUMMAGE; }
	override meshType() : MeshType { return MeshType.PURPLE_GLOVE; }

	override weaponConfig() : WeaponConfig { return PurpleGlove._config; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const charged = this.charged();
		const pos = this.shootPos();
		const vel = this.getDir().scale(0.75);
		this.addEntity(EntityType.STAR, {
			ttl: PurpleGlove._starTTL,
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: pos,
				vel: vel,
			},
		});

		this.soundPlayer().playFromEntity(SoundType.THROW, this.owner());
	}
}
