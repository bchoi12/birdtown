import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Keys } from 'game/component/keys'
import { Mesh } from 'game/component/mesh'
import { Profile } from 'game/component/profile'
import { Data, DataMap } from 'game/data'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { loader, LoadResult, Model } from 'game/loader'

import { Key } from 'ui'

import { ChangeTracker } from 'util/change_tracker'
import { defined } from 'util/common'
import { Funcs } from 'util/funcs'
import { Timer } from 'util/timer'
import { Vec2, Vec2Math } from 'util/vec2'

enum Animation {
	IDLE = "Idle",
	WALK = "Walk",
	JUMP = "Jump",
}

enum Bone {
	ARM = "arm.R",
	NECK = "neck",
}

enum CustomProp {
	UNKNOWN,
	FACING_SIGN,
	NECK_DIR,
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
	private readonly _controllableBones = new Set<string>([
		Bone.ARM, Bone.NECK
	]);

	private _keys : Keys;
	private _mesh : Mesh;
	private _playerMesh : BABYLON.Mesh;
	private _profile : Profile;

	private _facingSign : number;
	private _neckDir : number;

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

					result.skeletons[0].bones.forEach((bone : BABYLON.Bone) => {
						if (this._controllableBones.has(bone.name)) {
							component.registerBone(bone);
						}
					});

					// TODO: this doesn't seem to work
					let animationProperties = new BABYLON.AnimationPropertiesOverride();
					animationProperties.enableBlending = true;
					animationProperties.blendingSpeed = 0.2;
					result.skeletons[0].animationPropertiesOverride = animationProperties;

					component.setMesh(mesh);
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
		return super.ready() && this.metadata().hasClientId();
	}

	override initialize() : void {
		super.initialize();

		if (this.metadata().clientId() === game.id()) {
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

			// Set direction of player
			const pos = new BABYLON.Vector3(this._profile.pos().x, this._profile.pos().y, 0);
			const mouse = this._keys.mouseWorld();
			const dir = mouse.subtract(pos).normalize();
			this._facingSign = dir.x >= 0 ? 1 : -1;

			let rotation = Vec2Math.angleRad({x: dir.x, y: dir.y });
			if (dir.x >= 0) {
				if (dir.y < 0 && rotation < 7 / 4 * Math.PI) {
					rotation = 7 / 4 * Math.PI;
				} else if (dir.y > 0 && rotation > Math.PI / 4) {
					rotation = Math.PI / 4;
				}

				rotation *= -1;
			} else {
				rotation = Funcs.clamp(3 / 4 * Math.PI, rotation, 5 / 4 * Math.PI);
				rotation += Math.PI;
			}
			this._neckDir = rotation;

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

		if (!this._mesh.hasMesh()) {
			return;
		}

		if (!this.attributes().get(Attribute.GROUNDED) || this.attributes().get(Attribute.DEAD)) {
			this._mesh.playAnimation(Animation.JUMP);
		} else {
			if (Math.abs(this._profile.acc().x) < 0.01) {
				this._mesh.playAnimation(Animation.IDLE);
			} else {
				this._mesh.playAnimation(Animation.WALK);
			}
		}

		this._playerMesh.scaling.z = this._facingSign;
		let neck = this._mesh.getBone(Bone.NECK);
		neck.getTransformNode().rotation = new BABYLON.Vector3(this._neckDir, 0, 0);
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this.custom().set(CustomProp.FACING_SIGN, this._facingSign);
		this.custom().set(CustomProp.NECK_DIR, this._neckDir);
	}

	override mergeData(dataMap : DataMap, seqNum : number) : void {
		super.mergeData(dataMap, seqNum);

		if (this.custom().has(CustomProp.FACING_SIGN)) {
			this._facingSign = <number>this.custom().get(CustomProp.FACING_SIGN);
		}
		if (this.custom().has(CustomProp.NECK_DIR)) {
			this._neckDir = <number>this.custom().get(CustomProp.NECK_DIR);
		}
	}
}