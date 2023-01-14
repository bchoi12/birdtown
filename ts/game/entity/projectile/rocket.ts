import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Explosion } from 'game/entity/explosion'
import { Projectile } from 'game/entity/projectile'
import { loader, LoadResult, ModelType } from 'game/loader'

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
				return MATTER.Bodies.circle(pos.x, pos.y, /*radius=*/dim.x / 2, {
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
				loader.load(ModelType.ROCKET, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.name = this.name();
					mesh.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

					model.setMesh(mesh);
				});
			},
		}));
	}

	override delete() : void {
		super.delete();

		game.entities().addEntity(EntityType.EXPLOSION, {
			profileInit: {
				pos: this._profile.pos(),
				dim: {x: 3, y: 3},
			},
			onCreateFn: (explosion : Explosion) => { explosion.setTTL(200); },
		});
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		const vel = this._profile.vel();
		const angle = Vec2.fromVec(vel).angleRad();

		this._model.mesh().rotation = new BABYLON.Vector3(-angle, Math.PI / 2, 0);
	}

	override collide(other : Entity, collision : MATTER.Collision) : void {
		super.collide(other, collision);

		if (!this.isSource()) {
			return;
		}

		if (this._attributes.get(Attribute.OWNER) === other.id()) {
			return;
		}

		if (other.getComponent<Attributes>(ComponentType.ATTRIBUTES).getOrDefault(Attribute.SOLID)) {
			this.delete();
		}
	}
}