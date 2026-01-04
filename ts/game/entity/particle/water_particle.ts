import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { EntityOptions } from 'game/entity'
import { Particle } from 'game/entity/particle'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { ParticleType } from 'game/factory/api'

import { Vec2 } from 'util/vector'

export class WaterParticle extends Particle {

	private _initialScale : Vec2;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WATER_PARTICLE, entityOptions);
	}

	override particleType() : ParticleType { return ParticleType.WATER; }
	override processModel(model : Model) : void {
	}
	override resetModel(model : Model) : boolean {
		model.mesh().scaling.set(1, 1, 1);
		return true;
	}

	override initialize() : void {
		super.initialize();
		
		this._initialScale = this._profile.scaling().clone();
	}

	override updateParticle(stepData : StepData) : void {
		let scaling = this._profile.scaling();
		scaling.copyVec(this._initialScale).scale(1 - this.ttlElapsed());
		this._model.mesh().scaling.z = (scaling.x + scaling.y) / 2;
	}
}