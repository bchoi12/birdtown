import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { Profile } from 'game/profile'

export class Wall extends Entity {

	constructor(options : EntityOptions) {
		super(EntityType.WALL, options);

		const pos = options.pos;
		this.add(new Profile({
			bodyFn: () => {
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