import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Body } from 'game/body'
import { Entity, EntityOptions } from 'game/entity'
import { SpacedId } from 'game/spaced_id'

export class Wall extends Entity {

	constructor(options : EntityOptions) {
		super(options);

		const pos = options.pos;
		this.add(new Body({
			bodyFn: () => {
				return MATTER.Bodies.rectangle(pos.x, pos.y, /*width=*/16, /*height=*/1, {
					isStatic: true,
				});
			},
			meshFn: () => {
				return BABYLON.MeshBuilder.CreateBox(this.spacedId().toString(), {
					width: 16,
					height: 1,
					depth: 16,
				}, game.scene());
			},
		}));
	}
}