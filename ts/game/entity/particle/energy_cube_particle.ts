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
import { Vec2 } from 'util/vector'

export class EnergyCubeParticle extends Particle {

	private _initialScale : Vec2;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.ENERGY_CUBE_PARTICLE, entityOptions);
	}

	override initialize() : void {
		super.initialize();

		this._initialScale = this._profile.scaling().clone();
	}

	override particleType() : ParticleType { return ParticleType.CUBE; }
	override processModel(model : Model) : void {
		model.mesh().receiveShadows = false;
		game.world().glow(model.mesh(), { intensity: 0.6 });
	}
	override resetModel(model : Model) : boolean {
		model.mesh().receiveShadows = true;
		model.mesh().scaling.set(1, 1, 1);
		game.world().removeGlow(model.mesh());
		return true;
	}

	override updateParticle(stepData : StepData) : void {
		const weight = 1 - Fns.interp(InterpType.LINEAR, this.ttlElapsed());
		this._profile.setScaling({
			x: this._initialScale.x * weight,
			y: this._initialScale.y * weight,
		});
		this._model.mesh().scaling.z = (this._profile.scaling().x + this._profile.scaling().y) / 2;
	}
}