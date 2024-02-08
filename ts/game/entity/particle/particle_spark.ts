import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { EntityOptions } from 'game/entity'
import { Particle } from 'game/entity/particle'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { ParticleType } from 'game/factory/api'

import { FnGlobals, InterpType } from 'global/fn_globals'

import { Vec2 } from 'util/vector'

export class ParticleSpark extends Particle {

	private _initialVel : Vec2;
	private _initialScale : Vec2;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PARTICLE_SPARK, entityOptions);
	}

	override particleType() : ParticleType { return ParticleType.SPARK; }
	override processModel(model : Model) : void {
		model.mesh().receiveShadows = false;
	}
	override resetModel(model : Model) : void {
		model.mesh().receiveShadows = true;
		model.mesh().scaling.set(1, 1, 1);
	}

	override initialize() : void {
		super.initialize();

		this._initialVel = this._profile.vel().clone();
		this._initialScale = this._profile.scaling().clone();
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this._model.hasMesh()) {
			return;
		}

		this._profile.setAngle(this._profile.vel().angleRad());

		const weight = FnGlobals.interp(InterpType.NEGATIVE_SQUARE, this.ttlElapsed());
		this._profile.vel().copyVec(this._initialVel).scale(1 - weight);
		this._profile.scaling().y = this._initialScale.y * (1 - weight);
		this._model.mesh().scaling.z = this._profile.scaling().y;
	}
}