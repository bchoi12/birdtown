import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ParticleType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ParticleFactory } from 'game/factory/particle_factory'
import { StepData } from 'game/game_object'

import { Optional } from 'util/optional'

type UpdateFn = (stepData : StepData, particle : Particle) => void;

export abstract class Particle extends EntityBase implements Entity {

	private static readonly _defaultParticleTTL : number = 1000;

	private _updateFn : Optional<UpdateFn>;

	protected _model : Model;
	protected _profile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.PARTICLE);
		if (entityOptions.ttl <= 0) {
			this.setTTL(Particle._defaultParticleTTL);
		}

		this._updateFn = new Optional();

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				let mesh = ParticleFactory.borrowMesh(this.particleType());
				model.setMesh(mesh);
				this.processModel(model);
			},
			init: entityOptions.modelInit,
		}));
		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: this.bodyFn,
			init: entityOptions.profileInit,
		}));
		this._profile.setRenderNever();
	}

	override dispose() : void {
		super.dispose();

		// TODO: is this worth? Mesh is GC'd by dispose() and need to manage its visibility
		/*
		if (this._model.hasMesh()) {
			this.resetModel(this._model);
			ParticleFactory.returnMesh(this.particleType(), this._model.mesh());
		}
		*/
	}

	overrideUpdateFn(updateFn : UpdateFn) : void {
		this._updateFn.set(updateFn);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._updateFn.has()) {
			this._updateFn.get()(stepData, this);
		} else {
			this.updateParticle(stepData);
		}
	}

	protected bodyFn(profile : Profile) : MATTER.Body {
		return BodyFactory.circle(profile.pos(), profile.unscaledDim(), {
			isSensor: true,
			collisionFilter: BodyFactory.neverCollideFilter(),
		});
	}

	abstract particleType() : ParticleType;
	abstract processModel(model : Model) : void;
	abstract resetModel(model : Model) : void;

	abstract updateParticle(stepData : StepData) : void;
}

