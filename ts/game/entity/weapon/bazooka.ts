import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Attribute } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { Weapon } from 'game/entity/weapon'
import { loader, LoadResult, ModelType } from 'game/loader'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

export class Bazooka extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.BAZOOKA, options);

		this.attributes().set(Attribute.READY, true);
	}

	override modelType() : ModelType { return ModelType.BAZOOKA; }
	override shoot(mouse : Vec) : boolean {
		if (!this.model().hasMesh() || !this.attributes().get(Attribute.READY)) {
			return false;
		}

		const pos = Vec2.fromBabylon3(this.shootNode().getAbsolutePosition());
		const dir = Vec2.fromVec(mouse).sub(pos).normalize();

		const projectile = game.entities().add(EntityType.ROCKET, {
    		profileInitOptions: {
				pos: {x: pos.x, y: pos.y},
				dim: {x: 0.3, y: 0.3},
				vel: dir.clone().scale(0.1),
				acc: dir.clone().scale(1.5),
			},
		});
		projectile.attributes().set(Attribute.OWNER, this.attributes().get(Attribute.OWNER));
		projectile.setTTL(1000);

		this.reload(250);
		return true;
	}
}
