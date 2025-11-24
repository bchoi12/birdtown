
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType, SoundType } from 'game/factory/api'

export class SquawkShield extends Explosion {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SQUAWK_SHIELD, entityOptions);

		this._reflectProjectiles = true;
	}

	protected meshFn() : BABYLON.Mesh {
		let mesh = BABYLON.MeshBuilder.CreateTorus(this.name(), {
			thickness: 0.1,
			diameter: this._profile.dim().x,
		}, game.scene());

		mesh.rotation.y = Math.PI / 2;
		mesh.rotation.z = -Math.PI / 2;
		return mesh;
	}

	protected override soundType() : SoundType { return SoundType.UNKNOWN; }
	protected override force() : number { return 2; }
	protected override materialType() : MaterialType { return MaterialType.PARTICLE_WHITE; }

	protected override ttl() : number { return 1.5 * super.ttl(); }

}