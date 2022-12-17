import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Vec2 } from 'game/common'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Keys } from 'game/component/keys'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Data } from 'game/data'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { loader, LoadResult, Model } from 'game/loader'

import { Key } from 'ui'

import { ChangeTracker } from 'util/change_tracker'
import { defined } from 'util/common'
import { Timer } from 'util/timer'

enum Animation {
	IDLE = "Idle",
	WALK = "Walk",
	JUMP = "Jump",
}

export class Player extends Entity {
	private readonly _sideAcc = 1.0;
	private readonly _jumpVel = 0.3;
	private readonly _maxHorizontalVel = 0.3;
	private readonly _maxVerticalVel = 0.6;
	private readonly _maxVelMultiplier = 0.9;

	private readonly _turnMultiplier = 3.0;
	private readonly _fallMultiplier = 0.7;

	private readonly _friction = 0.7;
	private readonly _airResistance = 0.9;

	private readonly _rotationOffset = -0.1;
	private readonly _jumpGracePeriod = 100;

	private readonly _moveAnimations = new Set<string>([
		Animation.IDLE, Animation.WALK, Animation.JUMP
	]);

	private _keys : Keys;
	private _mesh : Mesh;
	private _playerMesh : BABYLON.Mesh;
	private _profile : Profile;

	private _jumpTimer : Timer;
	private _deadTracker : ChangeTracker<boolean>;

	constructor(options : EntityOptions) {
		super(EntityType.PLAYER, options);

		this.attributes().set(Attribute.DEAD, false);
		this.attributes().set(Attribute.GROUNDED, false);
		this.attributes().set(Attribute.SOLID, true);

		this._keys = <Keys>this.add(new Keys());

		this._profile = <Profile>this.add(new Profile({
			bodyFn: (pos : Vec2, dim : Vec2) => {
				return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					friction: 0,
				})
			},
		}));
		if (defined(options.pos)) {
			this._profile.setPos(options.pos);
		}
		this._profile.setInertia(Infinity);
		this._profile.setDim({x: 0.8, y: 1.44 });
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});

		this._mesh = <Mesh>this.add(new Mesh({
			readyFn: () => { return this.profile().ready(); },
			meshFn: (component : Mesh) => {
				loader.load(Model.CHICKEN, (result : LoadResult) => {
					const mesh = <BABYLON.Mesh>result.meshes[0];
					component.setMesh(mesh);

					const dim = this.profile().dim();
					this._playerMesh = mesh.getChildMeshes<BABYLON.Mesh>(/*direct=*/true)[0];
					this._playerMesh.rotation.y = Math.PI / 2 + this._rotationOffset;
					this._playerMesh.position.y -= dim.y / 2;

					result.animationGroups.forEach((animationGroup : BABYLON.AnimationGroup) => {
						if (this._moveAnimations.has(animationGroup.name)) {
							component.registerAnimation(animationGroup, 0);
						}
					})
					component.stopAllAnimations();

					let animationProperties = new BABYLON.AnimationPropertiesOverride();
					animationProperties.enableBlending = true;
					animationProperties.blendingSpeed = 0.1;
					result.skeletons[0].animationPropertiesOverride = animationProperties;
				});
			},
		}));

		this._jumpTimer = this.newTimer();

		this._deadTracker = new ChangeTracker(() => {
			return <boolean>this.attributes().get(Attribute.DEAD);
		}, (dead : boolean) => {
			if (dead) {
				const x = this._profile.vel().x;
				const sign = x < 0 ? 1 : -1;

				this._profile.addAngularVelocity(sign * Math.max(0.1, Math.abs(x)));
				this._profile.setAcc({x: 0, y: 0});
				this._profile.resetInertia();
			} else {
				this._profile.setAngle(0);
				this._profile.setAngularVelocity(0);
				this._profile.setInertia(Infinity);
			}
		});

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

		// Gravity
		this._profile.setAcc({ y: Profile.gravity });
		if (!this.attributes().get(Attribute.GROUNDED) && this._profile.vel().y < 0) {
			this._profile.addAcc({ y: this._fallMultiplier * Profile.gravity });
		}

		if (this._keys.keyDown(Key.INTERACT)) {
			this.attributes().set(Attribute.DEAD, true);
		} else {
			this.attributes().set(Attribute.DEAD, false);
		}

		this._deadTracker.check();

		if (!this.attributes().getOrDefault(Attribute.DEAD)) {
			// Keypress acceleration
			if (this._keys.keyDown(Key.LEFT)) {
				this._profile.setAcc({ x: -this._sideAcc });
			} else if (this._keys.keyDown(Key.RIGHT)) {
				this._profile.setAcc({ x: this._sideAcc });
			} else {
				this._profile.setAcc({ x: 0 });
			}

			// Turn acceleration
			const turning = Math.sign(this._profile.acc().x) === -Math.sign(this._profile.vel().x);
			if (turning) {
				this._profile.acc().x *= this._turnMultiplier;
			}

			// Jumping
			if (this._jumpTimer.on()) {
				if (this._keys.keyDown(Key.JUMP)) {
					this._profile.setVel({ y: this._jumpVel });
					this._jumpTimer.stop();
				}
			} else if (this.attributes().getOrDefault(Attribute.CAN_DOUBLE_JUMP) && this._keys.keyPressed(Key.JUMP)) {
				this._profile.setVel({ y: this._jumpVel });
				this.attributes().set(Attribute.CAN_DOUBLE_JUMP, false);
			}
		}

		// Friction and air resistance
		const slowing = Math.sign(this._profile.acc().x) !== Math.sign(this._profile.vel().x);
		if (this.attributes().get(Attribute.GROUNDED)) {
			if (slowing) {
				this._profile.vel().x *= this._friction;
			}
		} else {
			if (this._profile.acc().x === 0) {
				this._profile.vel().x *= this._airResistance;
			}
		}

		// Max speed
		if (Math.abs(this._profile.vel().x) > this._maxHorizontalVel) {
			this._profile.vel().x *= this._maxVelMultiplier;
		}
		if (Math.abs(this._profile.vel().y) > this._maxVerticalVel) {
			this._profile.vel().y *= this._maxVelMultiplier;
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

	override preRender() : void {
		super.preRender();

		if (!this.attributes().get(Attribute.GROUNDED) || this.attributes().get(Attribute.DEAD)) {
			this._mesh.playAnimation(Animation.JUMP);
		} else {
			if (Math.abs(this._profile.acc().x) < 0.01) {
				this._mesh.playAnimation(Animation.IDLE);
			} else {
				this._mesh.playAnimation(Animation.WALK);
			}
		}
	}
}