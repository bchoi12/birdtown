
import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Bolt } from 'game/entity/projectile/bolt'
import { Weapon, ShotConfig } from 'game/entity/equip/weapon'
import { MaterialType, MeshType } from 'game/factory/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Vec3 } from 'util/vector'

export class Claw extends Weapon {

	private static readonly _starTTL = 1000;

	constructor(options : EntityOptions) {
		super(EntityType.CLAW, options);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.THROW; }
	override meshType() : MeshType { return MeshType.GLOVE; }

	override shotConfig() : ShotConfig {
		return {
			bursts: 4,
			burstTime: 125,
			reloadTime: 750,
		};
	}

	override shoot() : void {
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
	}

	override onReload() : void {}
}
