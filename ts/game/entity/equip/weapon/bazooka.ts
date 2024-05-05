import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AttributeType, CounterType } from 'game/component/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Rocket } from 'game/entity/projectile/rocket'
import { Weapon, ShotConfig } from 'game/entity/equip/weapon'
import { MeshType } from 'game/factory/api'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Bazooka extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.BAZOOKA, options);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override meshType() : MeshType { return MeshType.BAZOOKA; }

	override shotConfig() : ShotConfig {
		return {
			bursts: 1,
			reloadTime: 1000,
		};
	}

	override shoot() : void {
		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = this.inputDir().clone().normalize();

		let vel = unitDir.clone().scale(0.05);
		let acc = unitDir.clone().scale(1.5);
		let [rocket, hasRocket] = this.addEntity<Rocket>(EntityType.ROCKET, {
			associationInit: {
				owner: this,
			},
			profileInit: {
				pos: pos,
				vel: vel,
				acc: acc,
			},
		});

		if (hasRocket) {
			this.recordUse();
			rocket.setTTL(850, () => {
				rocket.explode();
			});
			rocket.model().transforms().setTranslation({ z: pos.z });
		}
	}

	override reload() : void {}

	override getCounts() : Map<CounterType, number> {
		let counts = super.getCounts();
		counts.set(CounterType.ROCKET, this.reloadTimeLeft() / 1000);
		return counts;
	}
}
