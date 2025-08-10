import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType } from 'game/entity/equip'
import { Rocket } from 'game/entity/projectile/rocket'
import { Weapon, RecoilType, ReloadType } from 'game/entity/equip/weapon'
import { ColorType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { StepData } from 'game/game_object'

import { HudType, HudOptions } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Bazooka extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.BAZOOKA, options);

		this._skipRecoilOnEmpty = true;

		this.soundPlayer().registerSound(SoundType.ROCKET);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override hudType() : HudType { return HudType.ROCKET; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override reloadType() : ReloadType { return ReloadType.DISLOCATE; }
	override meshType() : MeshType { return MeshType.BAZOOKA; }

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const pos = this.shootPos();
		const unitDir = this.getDir();

		this.addEntity<Rocket>(this.charged() ? EntityType.MEGA_ROCKET : EntityType.ROCKET, this.getProjectileOptions(pos, unitDir));

		let recoil = unitDir.clone().negate().scale(this.getStat(this.charged() ? StatType.CHARGED_FORCE : StatType.FORCE));
		this.owner().addForce(recoil);

		this.soundPlayer().playFromEntity(SoundType.ROCKET, this.owner());
	}
}
