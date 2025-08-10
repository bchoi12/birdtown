import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Bullet } from 'game/entity/projectile/bullet'
import { Weapon, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { SoundFactory } from 'game/factory/sound_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec3 } from 'util/vector'

export class WingCannon extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.WING_CANNON, options);

		this._skipRecoilOnEmpty = true;

		this.soundPlayer().registerSound(SoundType.WING_CANNON);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.WHIP; }
	override reloadType() : ReloadType { return ReloadType.RAISE; }
	override meshType() : MeshType { return MeshType.WING_CANNON; }
	override hudType() : HudType { return HudType.ORBS; }


	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const unitDir = this.getDir();

		if (this.charged()) {
			this.addEntity(EntityType.LASER, this.getProjectileOptions(pos, unitDir, unitDir.angleRad()));

			let recoil = unitDir.clone().negate().scale(this.getStat(StatType.CHARGED_FORCE));
			this.owner().addForce(recoil);
		} else {
			this.addEntity(EntityType.ORB, this.getProjectileOptions(pos, unitDir, unitDir.angleRad()));
			this.soundPlayer().playFromEntity(SoundType.WING_CANNON, this.owner());

			let recoil = unitDir.clone().negate().scale(this.getStat(StatType.FORCE));
			this.owner().addForce(recoil);
		}
	}
}
