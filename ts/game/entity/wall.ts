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

export class Wall extends Entity {

	constructor(options : EntityOptions) {
		super(EntityType.WALL, options);

		this.attributes().set(Attribute.SOLID, true);

		let profile = <Profile>this.add(new Profile({
			bodyFn: (pos : Vec2, dim : Vec2) => {
				return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					isStatic: true,
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
				component.setMesh(BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: 16,
				}, game.scene()));
			},
		}));
	}
}