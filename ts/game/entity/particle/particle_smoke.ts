import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { EntityOptions } from 'game/entity'
import { Particle } from 'game/entity/particle'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { ParticleType } from 'game/system/api'

export class ParticleSmoke extends Particle {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PARTICLE_SMOKE, entityOptions);
	}

	override particleType() : ParticleType { return ParticleType.SMOKE; }
	override processMesh(mesh : BABYLON.Mesh) : void {}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this._model.hasMesh()) {
			return;
		}

		const millis = stepData.millis;
		let scaling = this._profile.scaling();
		scaling.subScalar(0.5 * millis / 1000).max({ x: 0, y: 0 });
		this._model.offlineTransforms().scaling().z = (scaling.x + scaling.y) / 2;

		if (this._profile.scaling().isZero()) {
			this.delete();
		}
	}
}