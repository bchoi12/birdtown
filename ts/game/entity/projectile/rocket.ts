import * as BABYLON from 'babylonjs'
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

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

export class Rocket extends Projectile {

	private _model : Model;
	private _profile : Profile;

	constructor(options : EntityOptions) {
		super(EntityType.ROCKET, options);

		this.setName({
			base: "rocket",
			id: this.id(),
		});

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
					mesh.name = this.name();
					mesh.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

					model.setMesh(mesh);
				});
			},
		}));
	}

	override damage() : number { return 50; }

	override preRender(millis : number) : void {
		super.preRender(millis);

		if (!this._model.hasMesh()) {
			return;
		}

		const vel = this._profile.vel();
		const angle = Vec2.fromVec(vel).angleRad();

		this._model.mesh().rotation = new BABYLON.Vector3(-angle, Math.PI / 2, 0);
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (!this.isSource()) {
			return;
		}

		if (this.matchAssociations([AssociationType.OWNER], other)) {
			return;
		}

		if (other.getAttribute(AttributeType.SOLID)) {
			other.takeDamage(this.damage(), this);
			this.explode();
			this.delete();
		}
	}
}