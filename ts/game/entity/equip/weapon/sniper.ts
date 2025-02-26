
import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Bolt } from 'game/entity/projectile/bolt'
import { Weapon, WeaponConfig, WeaponState, RecoilType } from 'game/entity/equip/weapon'
import { ColorType, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { KeyType, HudType, HudOptions } from 'ui/api'

import { Vec2, Vec3 } from 'util/vector'

export class Sniper extends Weapon {

	private static readonly _bursts = 3;
	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 70],
			[WeaponState.RELOADING, 350],
		]),
		bursts: Sniper._bursts,
	};
	private static readonly _chargeConfig = {
		times: new Map([
			[WeaponState.RELOADING, 500],
		]),
		bursts: 1,
	};

	private static readonly _chargedThreshold = 1000;
	private static readonly _boltTTL = 450;

	constructor(options : EntityOptions) {
		super(EntityType.SNIPER, options);

		this.soundPlayer().registerSound(SoundType.BOLT);
		this.soundPlayer().registerSound(SoundType.CHARGED_BOLT);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.SMALL; }
	override meshType() : MeshType { return MeshType.SNIPER; }

	override chargedThreshold() : number { return Sniper._chargedThreshold; }

	override weaponConfig() : WeaponConfig {
		return this.charged() ? Sniper._chargeConfig : Sniper._config;
	}

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const charged = this.charged();
		const pos = this.shootPos();
		const unitDir = this.getDir();

		let vel = unitDir.clone().scale(charged ? 1.1 : 0.8);
		let [bolt, hasBolt] = this.addEntity<Bolt>(EntityType.BOLT, {
			ttl: Sniper._boltTTL,
			associationInit: {
				owner: this.owner(),
			},
			modelInit: {
				materialType: charged ? MaterialType.SHOOTER_ORANGE : MaterialType.SHOOTER_BLUE,
			},
			profileInit: {
				pos: pos,
				vel: vel,
				angle: vel.angleRad(),
			},
		});

		if (hasBolt) {
			if (charged) {
				bolt.setAttribute(AttributeType.CHARGED, true);
				bolt.profile().setScaleFactor(1.5);
			}
		}

		this.soundPlayer().playFromEntity(charged ? SoundType.CHARGED_BOLT : SoundType.BOLT, this.owner());
	}
}
