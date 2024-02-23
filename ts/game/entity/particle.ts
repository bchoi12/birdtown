import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ParticleType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ParticleFactory } from 'game/factory/particle_factory'

export abstract class Particle extends EntityBase implements Entity {

	private static readonly _defaultParticleTTL : number = 1000;

	protected _model : Model;
	protected _profile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.PARTICLE);
		if (entityOptions.ttl <= 0) {
			this.setTTL(Particle._defaultParticleTTL);
		}

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
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
				});
			},
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

	abstract particleType() : ParticleType;
	abstract processModel(model : Model) : void;
	abstract resetModel(model : Model) : void;
}

