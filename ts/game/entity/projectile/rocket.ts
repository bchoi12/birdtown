import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { AssociationType, AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { Projectile } from 'game/entity/projectile'
import { MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

export class Rocket extends Projectile {

	private _model : Model;
	private _profile : Profile;

	constructor(options : EntityOptions) {
		super(EntityType.ROCKET, options);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				const pos = profile.pos();
				const dim = profile.dim();
				return BodyFactory.circle(profile.pos(), profile.dim(), {
					isSensor: true,
				});
			},
			init: options.profileInit,
		}));

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				const dim = this._profile.dim();
				MeshFactory.load(MeshType.ROCKET, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					model.setRotation({ y: Math.PI / 2 });
					model.setMesh(mesh);
				});
			},
		}));
	}

	override damage() : number { return 50; }

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (!this._model.hasMesh()) {
			return;
		}

		this._model.rotation().z += 6 * Math.PI * millis / 1000; 
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		this._model.mesh().rotation.x = -this._profile.vel().angleRad();
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (!this.isSource()) {
			return;
		}

		if (this.matchAssociations([AssociationType.OWNER], other)) {
			return;
		}

		// TODO: collide with multiple objects?
		if (other.getAttribute(AttributeType.SOLID)) {
			other.takeDamage(this.damage(), this);
			this.explode();
			this.delete();
		}
	}
}