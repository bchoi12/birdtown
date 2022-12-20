import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute } from 'game/component/attributes'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions, EntityType } from 'game/entity'

import { defined } from 'util/common'
import { Vec2 } from 'util/vec2'

export class Projectile extends Entity {

	constructor(options : EntityOptions) {
		super(EntityType.PROJECTILE, options);

		let profile = <Profile>this.add(new Profile({
			bodyFn: (pos : Vec2, dim : Vec2) => {
				return MATTER.Bodies.circle(pos.x, pos.y, dim.x, {
					isSensor: true,
				});
			},
			entityOptions: options,
		}));

		this.add(new Mesh({
			readyFn: () => {
				return this.profile().ready();
			},
			meshFn: (component : Mesh) => {
				const dim = this.profile().dim();
				component.setMesh(BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: dim.x,
				}, game.scene()));
			},
		}));
	}

	override ready() : boolean {
		return super.ready() && this.attributes().has(Attribute.OWNER);
	}

	override collide(other : Entity, collision : MATTER.Collision) : void {
		super.collide(other, collision);

		if (this.attributes().get(Attribute.OWNER) === other.id()) {
			return;
		}

		if (other.attributes().getOrDefault(Attribute.SOLID)) {
			this.delete();
		}
	}
}