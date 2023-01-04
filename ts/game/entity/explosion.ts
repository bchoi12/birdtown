import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Body } from 'game/component/body'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions, EntityType } from 'game/entity'

import { Vec, Vec2 } from 'util/vector'

export class Explosion extends Entity {

	private _hit : Set<number>;

	constructor(options : EntityOptions) {
		super(EntityType.EXPLOSION, options);

		this._hit = new Set();

		let profile = <Profile>this.add(new Profile({
			bodyOptions: {
				initFn: (body : Body) => {
					const pos = body.pos();
					const dim = body.dim();
					
					body.set(MATTER.Bodies.circle(pos.x, pos.y, /*radius=*/dim.x / 2, {
						isStatic: true,
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
				model.setMesh(BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: dim.x,
				}, game.scene()));
			},
		}));
	}

	override collide(other : Entity, collision : MATTER.Collision) : void {
		super.collide(other, collision);

		if (other.type() !== EntityType.PLAYER) {
			return;
		}

		if (this._hit.has(other.id())) {
			return;
		}

		this._hit.add(other.id());
		let force = Vec2.fromVec(other.profile().pos()).sub(this.profile().pos());
		force.normalize().scale(0.5);
		other.profile().addForce(force);
	}

}