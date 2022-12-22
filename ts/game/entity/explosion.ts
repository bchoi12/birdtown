import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions, EntityType } from 'game/entity'

import { Vec2, Vec2Math} from 'util/vec2'

export class Explosion extends Entity {

	private _hit : Set<number>;

	constructor(options : EntityOptions) {
		super(EntityType.EXPLOSION, options);

		this._hit = new Set();

		let profile = <Profile>this.add(new Profile({
			bodyFn: (pos : Vec2, dim : Vec2) => {
				return MATTER.Bodies.circle(pos.x, pos.y, /*radius=*/dim.x / 2, {
					isStatic: true,
					isSensor: true,
				});
			},
			entityOptions: options,
		}));

		this.add(new Mesh({
			readyFn: () => {
				return this.profile().ready();
			},
			meshFn: (component : Mesh) => {
				const dim = this.profile().dim();
				component.setMesh(BABYLON.MeshBuilder.CreateSphere(this.name(), {
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
		const force = Vec2Math.scale(Vec2Math.normalize(Vec2Math.sub(other.profile().pos(), this.profile().pos())), 0.5);
		other.profile().addForce(force);
	}

}