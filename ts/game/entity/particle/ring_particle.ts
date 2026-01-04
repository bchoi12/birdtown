import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { EntityOptions } from 'game/entity'
import { Particle } from 'game/entity/particle'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { ParticleType } from 'game/factory/api'

import { Fns, InterpType } from 'util/fns'
import { Vec3 } from 'util/vector'

export class RingParticle extends Particle {

	private _initialScale : Vec3;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.RING_PARTICLE, entityOptions);

		this._initialScale = Vec3.one();
	}

	override particleType() : ParticleType { return ParticleType.RING; }
	override processModel(model : Model) : void {
		model.rotation().y = Math.PI / 2;
		model.rotation().z = -Math.PI / 2;
	}
	override resetModel(model : Model) : boolean {
		model.rotation().setAll(0);
		model.mesh().scaling.set(1, 1, 1);
		return true;
	}

	override initialize() : void {
		super.initialize();
		
		this._initialScale.copyVec(this._model.scaling());
	}

	override updateParticle(stepData : StepData) : void {
		const weight = 1 + 2 * Fns.interp(InterpType.LINEAR, this.ttlElapsed());
		this._model.scaling().copyVec({
			x: this._initialScale.x * weight,
			y: this._initialScale.y * weight,
			z: this._initialScale.z * weight,
		});
	}
}