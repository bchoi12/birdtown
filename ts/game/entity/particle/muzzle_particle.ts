import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityOptions } from 'game/entity'
import { Particle } from 'game/entity/particle'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { CollisionCategory, ParticleType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'

import { GameGlobals } from 'global/game_globals'

import { Fns, InterpType } from 'util/fns'
import { Vec3 } from 'util/vector'

export class MuzzleParticle extends Particle {

	private _initialScale : Vec3;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.MUZZLE_PARTICLE, entityOptions);

		this._initialScale = Vec3.one();
	}

	override initialize() : void {
		super.initialize();

		this._initialScale.copyVec(this._model.scaling());
	}

	override renderShadows() : boolean { return false; }
	override particleType() : ParticleType { return ParticleType.TETRAHEDRON; }
	override processModel(model : Model) : void {
		model.mesh().receiveShadows = false;
	}
	override resetModel(model : Model) : boolean {
		model.mesh().receiveShadows = true;
		return true;
	}

	override updateParticle(stepData : StepData) : void {
		const weight = 1 - Fns.interp(InterpType.LINEAR, this.ttlElapsed() / 2);
		this._model.scaling().copyVec(this._initialScale).scale(weight);
	}
}