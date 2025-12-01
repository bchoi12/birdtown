import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType, SoundType } from 'game/factory/api'

export class PurpleBoltExplosion extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PURPLE_BOLT_EXPLOSION, entityOptions);
	}

	override meshFn() : BABYLON.Mesh {
		let mesh = super.meshFn();
		game.world().glow(mesh, { intensity: 0.4 });
		return mesh;
	}

	override force() : number { return 0.8; }
	override materialType() : MaterialType { return MaterialType.PARTICLE_PURPLE; }
	override soundType() : SoundType { return SoundType.BOOM; }
}