import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { EntityOptions } from 'game/entity'
import { Particle } from 'game/entity/particle'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { ParticleType } from 'game/factory/api'

import { Fns, InterpType } from 'util/fns'
import { Vec2 } from 'util/vector'

export class SweatParticle extends Particle {

	private _initialVel : Vec2;
	private _initialScale : Vec2;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SWEAT_PARTICLE, entityOptions);
	}

	override particleType() : ParticleType { return ParticleType.TEAR; }
	override processModel(model : Model) : void {
		model.mesh().receiveShadows = false;
	}
	override resetModel(model : Model) : boolean {
		model.mesh().receiveShadows = true;
		model.mesh().scaling.set(1, 1, 1);
		return true;
	}

	override initialize() : void {
		super.initialize();

		this._model.rotation().z = Math.PI / 2;

		this._profile.setGravityFactor(0.8);
		this._initialVel = this._profile.vel().clone();
		this._initialScale = this._profile.scaling().clone();
	}

	override updateParticle(stepData : StepData) : void {
		this._profile.setAngle(this._profile.vel().angleRad());

		const weight = 1 - Fns.interp(InterpType.SQUARE, this.ttlElapsed());
		this._profile.scaling().copyVec(this._initialScale).scale(weight);
		this._profile.vel().copyVec(this._initialVel).scale(weight);
		this._model.scaling().z = weight;
	}
}