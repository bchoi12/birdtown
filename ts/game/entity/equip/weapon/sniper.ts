import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

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
import { Weapon } from 'game/entity/equip/weapon'
import { MeshType } from 'game/factory/api'
import { StepData } from 'game/game_object'

import { KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { Vec2 } from 'util/vector'

export class Sniper extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.SNIPER, options);

		this.addNameParams({
			base: "sniper",
			id: this.id(),
		});

		this._attributes.setAttribute(AttributeType.READY, true);
	}

	override displayName() : string { return "thonker"; }
	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.SMALL; }
	override meshType() : MeshType { return MeshType.SNIPER; }

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

		let vel = unitDir.clone().scale(0.7);
		let [bolt, hasBolt] = this.addEntity<Bolt>(EntityType.BOLT, {
			associationInit: {
				owner: this,
			},
			profileInit: {
				pos: {x: pos.x, y: pos.y},
				dim: {x: 0.2, y: 0.1},
				vel: vel,
				angle: vel.angleRad(),
			},
		});

		if (hasBolt) {
			this.recordUse();
			bolt.setTTL(1000);
		}

		this.reload(125);
	}
}
