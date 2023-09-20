import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { EquipInput, AttachType, RecoilType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Rocket } from 'game/entity/projectile/rocket'
import { Weapon } from 'game/entity/weapon'
import { MeshType } from 'game/factory/api'
import { StepData } from 'game/game_object'

import { CounterType, KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Vec2 } from 'util/vector'

export class Bazooka extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.BAZOOKA, options);

		this.addNameParams({
			base: "bazooka",
			id: this.id(),
		});

		this._attributes.setAttribute(AttributeType.READY, true);
	}

	override displayName() : string { return "booty blaster 3000"; }
	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.LARGE; }
	override meshType() : MeshType { return MeshType.BAZOOKA; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this._model.hasMesh() || !this._attributes.getAttribute(AttributeType.READY)) {
			return;
		}

		if (!this.key(KeyType.MOUSE_CLICK, KeyState.DOWN)) {
			return;
		}

		const pos = Vec2.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = this.inputDir().clone().normalize();

		let vel = unitDir.clone().scale(0.05);
		let acc = unitDir.clone().scale(1.5);
		let [rocket, hasRocket] = this.addEntity<Rocket>(EntityType.ROCKET, {
			associationInit: {
				owner: this,
			},
			profileInit: {
				pos: {x: pos.x, y: pos.y},
				dim: {x: 0.3, y: 0.3},
				vel: vel,
				acc: acc,
			},
		});

		if (hasRocket) {
			this.recordUse();
			rocket.setTTL(1000, () => {
				rocket.explode();
			});
		}

		this.reload(1000);
	}

	override getCounts() : Map<CounterType, number> {
		return new Map([
			[CounterType.ROCKET, this.reloadTimeLeft() / 1000],
		]);
	}
}
