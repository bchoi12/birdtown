import { game } from 'game'
import { Model } from 'game/component/model'
import { EntityOptions } from 'game/entity'
import { Particle } from 'game/entity/particle'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { ParticleType } from 'game/system/api'

import { Vec2 } from 'util/vector'

export class ParticleSmoke extends Particle {

	private _initialScale : Vec2;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PARTICLE_SMOKE, entityOptions);
	}

	override particleType() : ParticleType { return ParticleType.SMOKE; }
	override processModel(model : Model) : void {
		this._initialScale = this._profile.scaling().clone();
	}
	override resetModel(model : Model) : void {
		model.mesh().material.alpha = 1;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this._model.hasMesh()) {
			return;
		}

		let scaling = this._profile.scaling();
		scaling.copyVec(this._initialScale).scale(1 - this.ttlElapsed());
		this._model.offlineTransforms().scaling().z = (scaling.x + scaling.y) / 2;

		this._model.mesh().material.alpha = 1 - this.ttlElapsed();
	}
}