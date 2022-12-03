import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions, EntityType } from 'game/entity'

import { defined } from 'util/common'

export class Wall extends Entity {

	constructor(options : EntityOptions) {
		super(EntityType.WALL, options);

		let profile = <Profile>this.add(new Profile({
			bodyFn: (entity : Entity) => {
				const pos = entity.profile().pos();
				const dim = entity.profile().dim();
				return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					isStatic: true,
				});
			},
		}));
		if (defined(options.pos)) {
			profile.setPos(options.pos);
		}
		if (defined(options.dim)) {
			profile.setDim(options.dim);
		}

		this.add(new Mesh({
			readyFn: (entity : Entity) => {
				return entity.profile().ready();
			},
			meshFn: (entity : Entity) => {
				const dim = entity.profile().dim();
				return BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: 16,
				}, game.scene());
			},
		}));
	}
}