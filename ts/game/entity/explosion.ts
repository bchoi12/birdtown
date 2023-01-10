import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Collider } from 'game/component/collider'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'

import { Vec, Vec2 } from 'util/vector'

export class Explosion extends EntityBase {

	private _hit : Set<number>;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.EXPLOSION, entityOptions);

		this._hit = new Set();

		let profile = <Profile>this.add(new Profile({
			mainCollider: {
				initFn: (collider : Collider) => {
					const pos = collider.pos();
					const dim = collider.dim();
					
					collider.set(MATTER.Bodies.circle(pos.x, pos.y, /*radius=*/dim.x / 2, {
						isStatic: true,
						isSensor: true,
					}));
				},
			},
			init: entityOptions.profileInit,
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