
import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip } from 'game/entity/equip'

import { Vec2 } from 'util/vector'

export class BirdBrain extends Equip {

	constructor(options : EntityOptions) {
		super(EntityType.BIRD_BRAIN, options);
	}

	override use(dir : Vec2) : boolean {
		console.log("use brain");

		const scene = game.world().scene();
		const mouse = game.mouse();
		const ray = new BABYLON.Ray(game.lakitu().camera().position, new BABYLON.Vector3(mouse.x, mouse.y, 0).subtractInPlace(game.lakitu().camera().position));
		const rayHelper = new BABYLON.RayHelper(ray);
		rayHelper.show(scene);
		const raycast = scene.pickWithRay(ray);

		if (raycast.hit && raycast.pickedMesh.metadata && raycast.pickedMesh.metadata.entityId) {
			let [other, found] = game.entities().getEntity(raycast.pickedMesh.metadata.entityId);

			if (found && other.hasComponent(ComponentType.ATTRIBUTES)) {
				let attributes = other.getComponent<Attributes>(ComponentType.ATTRIBUTES);
				if (attributes.getAttribute(AttributeType.PICKABLE)) {
					attributes.setAttribute(AttributeType.PICKED, true);
				}
			}
		}

		return true;
	}

	override release(dir : Vec2) : boolean {
		return true;
	}
}