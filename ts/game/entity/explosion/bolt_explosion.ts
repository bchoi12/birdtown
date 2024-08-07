import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType } from 'game/factory/api'

export class BoltExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOLT_EXPLOSION, entityOptions);

	}

	override meshFn() : BABYLON.Mesh {
		let mesh = super.meshFn();
		game.world().glow(mesh, { intensity: 0.4 });
		return mesh;
	}

	override force() : number { return 1; }
	override materialType() : MaterialType { return MaterialType.BOLT_EXPLOSION; }
}