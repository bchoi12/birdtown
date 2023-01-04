import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Attribute } from 'game/component/attributes'
import { Body } from 'game/component/body'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { Projectile } from 'game/entity/projectile'
import { loader, LoadResult, ModelType } from 'game/loader'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

export class Rocket extends Projectile {

	constructor(options : EntityOptions) {
		super(EntityType.ROCKET, options);

		let profile = <Profile>this.add(new Profile({
			bodyOptions: {
				initFn: (body : Body) => {
					const pos = body.pos();
					const dim = body.dim();
					body.set(MATTER.Bodies.circle(pos.x, pos.y, /*radius=*/dim.x / 2, {
						isSensor: true,
					}));
				},
				initOptions: options.bodyInitOptions,
			},
			initOptions: options.profileInitOptions,
		}));

		this.add(new Model({
			readyFn: () => {
				return this.profile().ready();
			},
			meshFn: (model : Model) => {
				const dim = this.profile().dim();
				loader.load(ModelType.ROCKET, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.name = this.name();
					mesh.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);

					model.setMesh(mesh);
				});
			},
		}));
	}

	override preRender() : void {
		super.preRender();

		if (!this.model().hasMesh()) {
			return;
		}

		const vel = this.profile().vel();
		const angle = Vec2.fromVec(vel).angleRad();

		this.model().mesh().rotation = new BABYLON.Vector3(-angle, Math.PI / 2, 0);
	}

	override collide(other : Entity, collision : MATTER.Collision) : void {
		super.collide(other, collision);

		if (this.attributes().get(Attribute.OWNER) === other.id()) {
			return;
		}

		if (other.attributes().getOrDefault(Attribute.SOLID)) {
			if (game.options().host) {
				let explosion = game.entities().add(EntityType.EXPLOSION, {
		    		bodyInitOptions: {
						pos: this.profile().pos(),
						dim: {x: 3, y: 3},
					},
				});
				explosion.setTTL(200);
			}
			this.delete();
		}
	}
}