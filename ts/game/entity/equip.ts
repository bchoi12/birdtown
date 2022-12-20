import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute } from 'game/component/attributes'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { loader, LoadResult, Model } from 'game/loader'

import { defined } from 'util/common'
import { Vec2 } from 'util/vec2'

export class Equip extends Entity {

	constructor(options : EntityOptions) {
		super(EntityType.EQUIP, options);

		this.add(new Mesh({
			meshFn: (component : Mesh) => {
				loader.load(Model.BAZOOKA, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.name = this.name();
					component.setMesh(mesh);

					const owner = game.entities().get(<number>this.attributes().get(Attribute.OWNER));
					owner.attach(this);
				});
			},
		}));
	}

	override ready() : boolean {
		return super.ready() && this.attributes().has(Attribute.OWNER);
	}
}
