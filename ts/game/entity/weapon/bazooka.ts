import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Profile } from 'game/component/profile'
import { Model } from 'game/component/model'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { Projectile } from 'game/entity/projectile'
import { Weapon } from 'game/entity/weapon'
import { MeshType } from 'game/loader'

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

	override meshType() : MeshType { return MeshType.BAZOOKA; }
	override shoot(dir : Vec2) : boolean {
		if (!this._model.hasMesh() || !this._attributes.get(Attribute.READY)) {
			return false;
		}

		const pos = Vec2.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = dir.clone().normalize();

		let vel = unitDir.clone().scale(0.1);
		let acc = unitDir.clone().scale(1.5);
		let projectile = game.entities().addEntity(EntityType.ROCKET, {
			profileInit: {
				pos: {x: pos.x, y: pos.y},
				dim: {x: 0.3, y: 0.3},
				vel: vel,
				acc: acc,
			},
		});

		projectile.runIf((p : Projectile) => {
			p.getComponent<Attributes>(ComponentType.ATTRIBUTES).set(Attribute.OWNER, this._attributes.get(Attribute.OWNER));
			p.setTTL(1000);
		});

		this.reload(250);
		return true;
	}
}
