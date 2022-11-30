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
			readyFn: (entity : Entity) => {
				return entity.has(ComponentType.PROFILE) && entity.profile().hasPos();
			},
			bodyFn: (entity : Entity) => {
				const pos = entity.profile().pos();
				return MATTER.Bodies.rectangle(pos.x, pos.y, /*width=*/16, /*height=*/1, {
					isStatic: true,
				});
			},
		}));
		if (defined(options.pos)) {
			profile.setPos(options.pos);
		}

		let mesh = <Mesh>this.add(new Mesh({
			readyFn: (entity : Entity) => {
				return entity.has(ComponentType.PROFILE) && entity.profile().hasPos();
			},
			meshFn: () => {
				return BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: 16,
					height: 1,
					depth: 16,
				}, game.scene());
			},
		}));
	}
}