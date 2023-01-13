import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Weapon } from 'game/entity/weapon'
import { loader, LoadResult, ModelType } from 'game/loader'

import { defined } from 'util/common'
import { Vec2 } from 'util/vector'

export class Bazooka extends Weapon {

	constructor(options : EntityOptions) {
		super(EntityType.BAZOOKA, options);

		this.setName({
			base: "bazooka",
			id: this.id(),
		});

		this._attributes.set(Attribute.READY, true);
	}

	override modelType() : ModelType { return ModelType.BAZOOKA; }
	override shoot(dir : Vec2) : boolean {
		if (!this._model.hasMesh() || !this._attributes.get(Attribute.READY)) {
			return false;
		}

		const pos = Vec2.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = dir.clone().normalize();

		const projectile = game.entities().addEntity(EntityType.ROCKET, {
			profileInit: {
				pos: {x: pos.x, y: pos.y},
				dim: {x: 0.3, y: 0.3},
				vel: unitDir.clone().scale(0.1),
				acc: unitDir.clone().scale(1.5),
			},
		});
		projectile.getComponent<Attributes>(ComponentType.ATTRIBUTES).set(Attribute.OWNER, this._attributes.get(Attribute.OWNER));
		projectile.setTTL(1000);

		this.reload(250);
		return true;
	}
}
