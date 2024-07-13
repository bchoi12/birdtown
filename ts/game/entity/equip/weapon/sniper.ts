
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType, CounterType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { SoundPlayer } from 'game/component/sound_player'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Bolt } from 'game/entity/projectile/bolt'
import { Weapon, ShotConfig } from 'game/entity/equip/weapon'
import { MaterialType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { CounterOptions, KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Vec3 } from 'util/vector'

export class Sniper extends Weapon {

	private static readonly _chargedThreshold = 1000;
	private static readonly _boltTTL = 750;

	private _soundPlayer : SoundPlayer;

	constructor(options : EntityOptions) {
		super(EntityType.SNIPER, options);

		this._soundPlayer = this.addComponent<SoundPlayer>(new SoundPlayer());
		this._soundPlayer.registerSound(SoundType.LASER, SoundType.LASER);
		this._soundPlayer.registerSound(SoundType.CHARGED_LASER, SoundType.CHARGED_LASER);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.SMALL; }
	override meshType() : MeshType { return MeshType.SNIPER; }

	override charged() : boolean { return this.getCounter(CounterType.CHARGE) >= Sniper._chargedThreshold; }

	override shotConfig() : ShotConfig {
		if (this.charged()) {
			return {
				bursts: 1,
				reloadTime: 500,
			};
		}
		return {
			bursts: 3,
			burstTime: 80,
			reloadTime: 300,
		};
	}

	override shoot() : void {
		const charged = this.charged();
		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = this.inputDir().clone().normalize();

		let vel = unitDir.clone().scale(charged ? 1 : 0.7);
		let [bolt, hasBolt] = this.addEntity<Bolt>(EntityType.BOLT, {
			ttl: Sniper._boltTTL,
			associationInit: {
				owner: this.owner(),
			},
			modelInit: {
				transforms: {
					translate: { z: pos.z },
				},
				materialType: charged ? MaterialType.BOLT_ORANGE : MaterialType.BOLT_BLUE,
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

		this._soundPlayer.playFromEntity(charged ? SoundType.CHARGED_LASER : SoundType.LASER, this.owner());
	}

	override onReload() : void {
		if (this.charged()) {
			this.setCounter(CounterType.CHARGE, 0);
		}
	}

	override getCounts() : Map<CounterType, CounterOptions> {
		let counts = super.getCounts();
		counts.set(CounterType.CHARGE, {
			percentGone: this.getCounter(CounterType.CHARGE) / Sniper._chargedThreshold,
			text: this.charged() ? "1/1" : "0/1",
			color: ColorFactory.boltDarkOrange.toString(),
		});
		return counts;
	}
}
