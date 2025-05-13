
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

import { HudType, KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Vec3 } from 'util/vector'

export class RedGlove extends Weapon {

	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 125],
			[WeaponState.RELOADING, 550],
		]),
		bursts: 2,
	};
	private static readonly _knifeTTL = 550;

	constructor(options : EntityOptions) {
		super(EntityType.RED_GLOVE, options);

		this.soundPlayer().registerSound(SoundType.THROW);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override hudType() : HudType { return HudType.SWORDS; }
	override reloadType() : ReloadType { return ReloadType.RUMMAGE; }
	override recoilType() : RecoilType { return RecoilType.THROW; }
	override meshType() : MeshType { return MeshType.RED_GLOVE; }

	override weaponConfig() : WeaponConfig { return RedGlove._config; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const charged = this.charged();
		const pos = this.shootPos();
		const vel = this.getDir().scale(0.85);
		this.addEntity(EntityType.KNIFE, {
			ttl: RedGlove._knifeTTL,
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
