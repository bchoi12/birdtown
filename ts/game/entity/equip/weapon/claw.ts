
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { SoundPlayer } from 'game/component/sound_player'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Bolt } from 'game/entity/projectile/bolt'
import { Weapon, WeaponConfig, WeaponState } from 'game/entity/equip/weapon'
import { MaterialType, MeshType, SoundType } from 'game/factory/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { HudType, KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Vec3 } from 'util/vector'

export class Claw extends Weapon {

	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 125],
			[WeaponState.RELOADING, 750],
		]),
		bursts: 4,
	};
	private static readonly _starTTL = 1000;

	private _soundPlayer : SoundPlayer;

	constructor(options : EntityOptions) {
		super(EntityType.CLAW, options);

		this._soundPlayer = this.addComponent<SoundPlayer>(new SoundPlayer());
		this._soundPlayer.registerSound(SoundType.THROW, SoundType.THROW);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override hudType() : HudType { return HudType.STAR; }
	override recoilType() : RecoilType { return RecoilType.THROW; }
	override meshType() : MeshType { return MeshType.GLOVE; }

	override weaponConfig() : WeaponConfig { return Claw._config; }

	override shoot(stepData : StepData) : void {
		const charged = this.charged();
		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());
		const vel = this.inputDir().clone().setLength(0.7);
		let [star, hasStar] = this.addEntity<Bolt>(EntityType.STAR, {
			ttl: Claw._starTTL,
			associationInit: {
				owner: this.owner(),
			},
			modelInit: {
				transforms: {
					translate: { z: pos.z },
				},
			},
			profileInit: {
				pos: pos,
				vel: vel,
			},
		});

		this._soundPlayer.playFromEntity(SoundType.THROW, this.owner());
	}

	override onReload() : void {}
}
