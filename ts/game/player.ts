import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Entity, EntityOptions } from 'game/entity'
import { Keys } from 'game/keys'
import { Profile } from 'game/profile'
import { SpacedId } from 'game/spaced_id'

import { Key } from 'ui/input'

export class Player extends Entity {

	constructor(options : EntityOptions) {
		super(options);

		this.add(new Keys());

		const pos = options.pos;
		this.add(new Profile({
			bodyFn: () => {
				return MATTER.Bodies.circle(pos.x, pos.y, /*radius=*/1);
			},
			meshFn: () => {
				return BABYLON.MeshBuilder.CreateSphere(this.spacedId().toString(), {
					diameter: 2,
				}, game.scene());
			},
		}));
	}

	preUpdate(ts : number) : void {
		super.preUpdate(ts);

		const keys = <Keys>this.get(ComponentType.KEYS);
		let profile = <Profile>this.get(ComponentType.PROFILE);

		if (keys.keyDown(Key.LEFT)) {
			MATTER.Body.applyForce(profile.body(), profile.pos(), { x: -0.000001, y: 0 });
		} else if (keys.keyDown(Key.RIGHT)) {
			MATTER.Body.applyForce(profile.body(), profile.pos(), { x: 0.000001, y: 0 });
		}
	}
}