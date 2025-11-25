
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType, SoundType } from 'game/factory/api'
import { StepData } from 'game/game_object'

abstract class SquawkShieldBase extends Explosion {

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

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
	protected override materialType() : MaterialType { return MaterialType.PARTICLE_WHITE; }

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		this._model.rotation().z += 2 * Math.PI * millis / 1000; 
	}
}

export class SquawkShield extends SquawkShieldBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SQUAWK_SHIELD, entityOptions);
	}

	protected override force() : number { return 1.5; }
}

export class MegaSquawkShield extends SquawkShieldBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.MEGA_SQUAWK_SHIELD, entityOptions);
	}

	protected override force() : number { return 2; }
	protected override ttl() : number { return 1.25 * super.ttl(); }
}