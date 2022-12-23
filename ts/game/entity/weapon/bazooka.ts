import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Attribute } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { Weapon } from 'game/entity/weapon'
import { loader, LoadResult, ModelType } from 'game/loader'

import { defined } from 'util/common'
import { Vec2, Vec2Math } from 'util/vec2'

export class Bazooka extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.BAZOOKA, options);

		this.attributes().set(Attribute.READY, true);
	}

	override modelType() : ModelType { return ModelType.BAZOOKA; }
	override shoot(mouse : Vec2) : boolean {
		if (!this.model().hasMesh() || !this.attributes().get(Attribute.READY)) {
			return false;
		}

		const pos = this.shootNode().getAbsolutePosition();
		const pos2 = {x: pos.x, y: pos.y};

		const dir = Vec2Math.normalize(Vec2Math.sub(mouse, pos2));

		const projectile = game.entities().add(EntityType.ROCKET, {
			pos: {x: pos2.x, y: pos2.y},
			dim: {x: 0.3, y: 0.3},
			vel: Vec2Math.scale(dir, 0.1),
			acc: Vec2Math.scale(dir, 1.5),
		});
		projectile.attributes().set(Attribute.OWNER, this.attributes().get(Attribute.OWNER));
		projectile.setTTL(1000);

		this.reload(250);
		return true;
	}
}
