import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute } from 'game/component/attributes'
import { Collider } from 'game/component/collider'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions, EntityType } from 'game/entity'

import { defined } from 'util/common'
import { Vec } from 'util/vector'

export class Wall extends Entity {

	constructor(options : EntityOptions) {
		super(EntityType.WALL, options);

		this.attributes().set(Attribute.SOLID, true);

		let profile = <Profile>this.add(new Profile({
			mainCollider: {
				initFn: (collider : Collider) => {
					const pos = collider.pos();
					const dim = collider.dim();
					collider.set(MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
						isStatic: true,
					}));
				},
			},
			init: options.profileInit,
		}));

		this.add(new Model({
			readyFn: () => {
				return this.profile().ready();
			},
			meshFn: (model : Model) => {
				const dim = this.profile().dim();
				model.setMesh(BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: 16,
				}, game.scene()));
			},
		}));
	}
}