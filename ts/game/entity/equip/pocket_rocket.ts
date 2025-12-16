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
import { ColorType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { HudType, HudOptions, KeyType } from 'ui/api'

import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class PocketRocket extends Equip<Player> {

	private _weapon : Weapon;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.POCKET_ROCKET, entityOptions);

		this._weapon = null;

		this.soundPlayer().registerSound(SoundType.ROCKET);
	}

	override attachType() : AttachType { return AttachType.NONE; }
	override checkCanUse() : boolean { return super.checkCanUse() && this._weapon !== null; }
	protected override hudType() : HudType { return HudType.POCKET_ROCKET; }

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (this._weapon === null || !this._weapon.valid()) {
			const weapons = <Weapon[]>this.owner().equips().findN((equip : Equip<Player>) => {
				return equip.hasType(EntityType.WEAPON) && equip.valid();
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

		if (this.canUse() && this.useKeyDown()) {
			this.recordUse();
		}
	}

	override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this._weapon.shootPos();
		const unitDir = this._weapon.getDir();

		this.addEntity(EntityType.MINI_ROCKET, this.getProjectileOptions(pos, unitDir));

		this.soundPlayer().playFromEntity(SoundType.ROCKET, this.owner(), { playbackRate: 1.2 });
	}
}