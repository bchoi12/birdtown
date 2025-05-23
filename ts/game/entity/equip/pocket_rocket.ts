import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { SoundPlayer } from 'game/component/sound_player'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Weapon } from 'game/entity/equip/weapon'
import { Player } from 'game/entity/player'
import { Rocket } from 'game/entity/projectile/rocket'
import { ColorType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class PocketRocket extends Equip<Player> {

	private static readonly _rocketTTL = 600;
	private static readonly _reloadTime = 1500;

	private _timer : Timer;
	private _weapon : Weapon;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.POCKET_ROCKET, entityOptions);

		this._timer = this.newTimer({
			canInterrupt: false,
		});
		this._weapon = null;

		this.soundPlayer().registerSound(SoundType.ROCKET);
	}

	override attachType() : AttachType { return AttachType.NONE; }

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();
		hudData.set(HudType.POCKET_ROCKET, {
			charging: !this.canUse(),
			percentGone: this.canUse() ? 0 : (1 - this._timer.percentElapsed()),
			empty: true,
			color: this.clientColorOr(ColorFactory.color(ColorType.BLASTER_RED).toString()),
			keyType: KeyType.ALT_MOUSE_CLICK,
		});
		return hudData;
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (this._weapon === null || !this._weapon.valid()) {
			const weapons = <Weapon[]>this.owner().equips().findN((equip : Equip<Player>) => {
				return equip.allTypes().has(EntityType.WEAPON) && equip.valid();
			}, 1);

			if (weapons.length < 1) {
				this._weapon = null;
				return;
			}

			this._weapon = weapons[0];
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		this.setCanUse(!this._timer.hasTimeLeft());

		if (!this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN) || !this.canUse() || this._weapon === null) {
			return;
		}

		const pos = this._weapon.shootPos();
		const unitDir = this._weapon.getDir();

		let vel = unitDir.clone().scale(0.05);
		let acc = unitDir.clone().scale(1.5);
		let [rocket, hasRocket] = this.addEntity<Rocket>(EntityType.ROCKET, {
			ttl: PocketRocket._rocketTTL,
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: pos,
				vel: vel,
				acc: acc,
			},
		});

		this.soundPlayer().playFromEntity(SoundType.ROCKET, this.owner());
		// TODO: weapon recoil or effect?
		this._timer.start(PocketRocket._reloadTime);
	}
}