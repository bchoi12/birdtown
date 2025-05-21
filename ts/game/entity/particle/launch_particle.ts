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

export class LaunchParticle extends Particle {

	private _initialScale : Vec3;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.LAUNCH_PARTICLE, entityOptions);

		this._initialScale = Vec3.one();
	}

	override renderShadows() : boolean { return true; }
	override particleType() : ParticleType { return ParticleType.TORUS; }
	override processModel(model : Model) : void {
		model.material<BABYLON.StandardMaterial>().specularPower = 0;
	}
	override resetModel(model : Model) : boolean {
		model.material<BABYLON.StandardMaterial>().specularPower = 64;
		model.mesh().scaling.set(1, 1, 1);
		return true;
	}

	override initialize() : void {
		super.initialize();
		
		this._initialScale.copyVec(this._model.scaling());
	}

	override updateParticle(stepData : StepData) : void {
		const weight = Fns.interp(InterpType.LINEAR, this.ttlElapsed());
		this._model.scaling().copyVec({
			x: this._initialScale.x + 0.2 * weight,
			y: Math.max(0.5, 1 - weight) * this._initialScale.y,
			z: this._initialScale.z + 0.2 * weight,
		});
	}
}