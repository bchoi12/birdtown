import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { Profile } from 'game/component/profile'

export class Wall extends Entity {

	constructor(options : EntityOptions) {
		super(EntityType.WALL, options);

		this.add(new Profile({
			readyFn: (profile : Profile) => {
				return profile.hasPos();
			},
			bodyFn: (profile : Profile) => {
				const pos = profile.pos();
				return MATTER.Bodies.rectangle(pos.x, pos.y, /*width=*/16, /*height=*/1, {
					isStatic: true,
				});
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