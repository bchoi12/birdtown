import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Keys } from 'game/component/keys'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Data } from 'game/data'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { loader, Model } from 'game/loader'

import { Key } from 'ui'

import { defined } from 'util/common'
import { Timer } from 'util/timer'

export class Player extends Entity {
	private readonly _rotationOffset = -0.1;
	private readonly _jumpGracePeriod = 100;

	private _keys : Keys;
	private _mesh : Mesh;
	private _playerMesh : BABYLON.Mesh;
	private _profile : Profile;

	private _jumpTimer : Timer;

	constructor(options : EntityOptions) {
		super(EntityType.PLAYER, options);

		this.attributes().set(Attribute.GROUNDED, false);
		this.attributes().set(Attribute.SOLID, true);

		this._keys = <Keys>this.add(new Keys());

		this._profile = <Profile>this.add(new Profile({
			bodyFn: (entity : Entity) => {
				const pos = entity.profile().pos();
				const dim = entity.profile().dim();
				return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					inertia: Infinity,
					friction: 0,
				})
			},
		}));
		if (defined(options.pos)) {
			this._profile.setPos(options.pos);
		}
		this._profile.setDim({x: 0.8, y: 1.44 });
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});

		this._mesh = <Mesh>this.add(new Mesh({
			readyFn: (entity : Entity) => { return entity.profile().ready(); },
			meshFn: (entity : Entity, onLoad : (mesh : BABYLON.Mesh) => void) => {
				loader.load(Model.CHICKEN, (mesh : BABYLON.Mesh) => {
					onLoad(mesh);

					const dim = entity.profile().dim();
					this._playerMesh = mesh.getChildMeshes<BABYLON.Mesh>(/*direct=*/true)[0];
					this._playerMesh.rotation.y = Math.PI / 2 + this._rotationOffset;
					this._playerMesh.position.y -= dim.y / 2;
				});
			},
		}));

		this._jumpTimer = this.newTimer();
	}

	override ready() : boolean {
		return super.ready() && this.hasClientId();
	}

	override initialize() : void {
		super.initialize();

		if (this.clientId() === game.id()) {
			game.camera().setEntity(this);
		}
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		// Out of bounds
		if (this._profile.body().position.y < -8) {
			this._profile.setPos({ x: 0, y: 10 });
			this._profile.setVel({ x: 0, y: 0 });
		}

		// Keypress acceleration
		if (this._keys.keyDown(Key.LEFT)) {
			this._profile.setAcc({ x: -1 });
		} else if (this._keys.keyDown(Key.RIGHT)) {
			this._profile.setAcc({ x: 1 });
		} else {
			this._profile.setAcc({ x: 0 });
		}

		// Gravity
		this._profile.setAcc({ y: Profile.gravity });
		if (!this.attributes().get(Attribute.GROUNDED) && this._profile.vel().y < 0) {
			this._profile.addAcc({ y: 0.7 * Profile.gravity });
		}

		// Turn acceleration
		const turning = Math.sign(this._profile.acc().x) === -Math.sign(this._profile.vel().x);
		if (turning) {
			this._profile.acc().x *= 3;
		}

		// Jumping
		if (this._jumpTimer.on()) {
			if (this._keys.keyDown(Key.JUMP)) {
				this._profile.setVel({ y: 0.3 });
				this._jumpTimer.stop();
			}
		} else if (this.attributes().getOrDefault(Attribute.CAN_DOUBLE_JUMP) && this._keys.keyPressed(Key.JUMP)) {
			this._profile.setVel({ y: 0.3 });
			this.attributes().set(Attribute.CAN_DOUBLE_JUMP, false);
		}

		// Friction and air resistance
		const slowing = Math.sign(this._profile.acc().x) !== Math.sign(this._profile.vel().x);
		if (this.attributes().get(Attribute.GROUNDED)) {
			if (slowing) {
				this._profile.vel().x *= 0.85;
			}
		} else {
			if (this._profile.acc().x === 0) {
				this._profile.vel().x *= 0.95;
			}
		}

		// Max speed
		if (Math.abs(this._profile.vel().x) > 0.3) {
			this._profile.vel().x *= 0.9;
		}
		if (Math.abs(this._profile.vel().y) > 0.6) {
			this._profile.vel().y *= 0.9;
		}
	}

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		this.attributes().set(Attribute.GROUNDED, false);
	}

	override collide(other : Entity) : void {
		super.collide(other);

		if (other.attributes().getOrDefault(Attribute.SOLID) && this.profile().above(other.profile())) {
			this.attributes().set(Attribute.GROUNDED, true);
			this.attributes().set(Attribute.CAN_DOUBLE_JUMP, true);
			this._jumpTimer.start(this._jumpGracePeriod);
		}
	}
}