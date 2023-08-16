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
import { Bolt } from 'game/entity/projectile/bolt'
import { Weapon } from 'game/entity/weapon'
import { MeshType } from 'game/factory/api'

import { defined } from 'util/common'
import { Vec2 } from 'util/vector'

export class Sniper extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.SNIPER, options);

		this.setName({
			base: "sniper",
			id: this.id(),
		});

		this._attributes.setAttribute(AttributeType.READY, true);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.SMALL; }
	override meshType() : MeshType { return MeshType.SNIPER; }
	override updateInput(input : EquipInput) : boolean {
		if (!this._model.hasMesh() || !this.keysIntersect(input.keys) || !this._attributes.getAttribute(AttributeType.READY)) { return false; }

		const pos = Vec2.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = input.dir.clone().normalize();

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
			levelVersion: this.levelVersion(),
		});

		if (hasBolt) {
			this.recordUse();
			bolt.setTTL(1000);
		}

		this.reload(125);
		return true;
	}
}
