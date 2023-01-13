import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { GameConstants } from 'game/core'
import { Data, DataMap } from 'network/data'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Weapon } from 'game/entity/weapon'
import { loader, LoadResult, ModelType } from 'game/loader'

import { Key } from 'ui'

import { ChangeTracker } from 'util/change_tracker'
import { defined } from 'util/common'
import { Funcs } from 'util/funcs'
import { Timer } from 'util/timer'
import { Vec, Vec2 } from 'util/vector'

enum Animation {
	IDLE = "Idle",
	WALK = "Walk",
	JUMP = "Jump",
}
 
enum Bone {
	ARM = "arm.R",
	ARMATURE = "Armature",
	NECK = "neck",
	SPINE = "spine",
}

enum Part {
	UNKNOWN,
	HEAD,
}

enum Prop {
	UNKNOWN,
	ARM_ANGLE,
	FACING_SIGN,
	HEAD_ANGLE,
}

export class Player extends EntityBase {
	// blockdudes3 = 18.0
	private readonly _sideAcc = 1.0;
	private readonly _jumpVel = 0.3;
	private readonly _maxHorizontalVel = 0.25;
	private readonly _maxVerticalVel = 0.6;
	private readonly _maxVelMultiplier = 0.9;

	private readonly _turnMultiplier = 3.0;
	private readonly _fallMultiplier = 1.5;

	private readonly _friction = 0.7;
	private readonly _airResistance = 0.9;

	private readonly _rotationOffset = -0.1;
	private readonly _jumpGracePeriod = 100;

	private readonly _moveAnimations = new Set<string>([
		Animation.IDLE, Animation.WALK, Animation.JUMP
	]);
	private readonly _controllableBones = new Set<string>([
		Bone.ARM, Bone.ARMATURE, Bone.NECK, Bone.SPINE,
	]);

	private _attributes : Attributes;
	private _model : Model;
	private _profile : Profile;

	private _weapon : Weapon;

	private _jumpTimer : Timer;
	private _deadTracker : ChangeTracker<boolean>;

	private _armAngle : number;
	private _facingSign : number;
	private _headAngle : number;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLAYER, entityOptions);

		this.setName({
			base: "player",
			id: this.id(),
		});

		this._attributes = this.getComponent<Attributes>(ComponentType.ATTRIBUTES);
		this._attributes.set(Attribute.DEAD, false);
		this._attributes.set(Attribute.GROUNDED, false);
		this._attributes.set(Attribute.SOLID, true);

		const collisionGroup = MATTER.Body.nextGroup(true);
		this._profile = <Profile>this.addComponent(new Profile({
			initFn: (profile : Profile) => {
				const pos = profile.pos();
				const dim = profile.dim();

				profile.set(MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
					collisionFilter: {
						group: collisionGroup,
					},
					friction: 0,
				}));
				// TODO: re-enable
				/*
				let head = new Collider({
					initFn: (collider : Collider) => {
						const pos = collider.pos();
						const dim = collider.dim();

						collider.set(MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {
							collisionFilter: {
								group: collisionGroup,
							},
						}));
					},
				});
				head.setPos(pos.clone().add({y: 0.22}));
				head.setDim({x: 0.96, y: 1.06});
				head.setPrePhysicsFn((head : Collider, millis : number) => {
					head.setPos(this._profile.pos().clone().add({y: 0.22}));
				});
				profile.addCollider(Part.HEAD, head);
				*/
			},
			init: entityOptions.profileInit,
		}));

		this._profile.setAngle(0);
		this._profile.setDim({x: 0.8, y: 1.44 });
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});

		this._model = <Model>this.addComponent(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				loader.load(ModelType.CHICKEN, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.name = this.name();

					result.animationGroups.forEach((animationGroup : BABYLON.AnimationGroup) => {
						if (this._moveAnimations.has(animationGroup.name)) {
							model.registerAnimation(animationGroup, 0);
						}
					})
					model.stopAllAnimations();

					result.skeletons[0].bones.forEach((bone : BABYLON.Bone) => {
						if (this._controllableBones.has(bone.name)) {
							model.registerBone(bone);
						}
					});
					let armature = model.getBone(Bone.ARMATURE).getTransformNode();
					armature.rotation = new BABYLON.Vector3(0, Math.PI / 2 + this._rotationOffset, 0);
					const dim = this._profile.dim();
					armature.position.y -= dim.y / 2;

					// TODO: this doesn't seem to work
					let animationProperties = new BABYLON.AnimationPropertiesOverride();
					animationProperties.enableBlending = true;
					animationProperties.blendingSpeed = 0.2;
					result.skeletons[0].animationPropertiesOverride = animationProperties;

					model.setMesh(mesh);
				});
			},
		}));

		this._jumpTimer = this.newTimer();

		this._deadTracker = new ChangeTracker(() => {
			return <boolean>this._attributes.get(Attribute.DEAD);
		}, (dead : boolean) => {
			if (dead) {
				const x = this._profile.vel().x;
				const sign = x >= 0 ? -1 : 1;

				this._profile.resetInertia();
				this._profile.setAngularVelocity(sign * Math.max(0.1, Math.abs(x)));
				this._profile.setAcc({x: 0, y: 0});
			} else {
				this._profile.setAngle(0);
				this._profile.setAngularVelocity(0);
				this._profile.setInertia(Infinity);
			}
		});

		/*
		this.registerProp(Prop.ARM_ANGLE, {
			has: () => { return defined(this._armAngle); },
			export: () => { return this._armAngle; },
			import: (obj : Object) => { this._armAngle = <number>obj; },
		});
		this.registerProp(Prop.FACING_SIGN, {
			has: () => { return defined(this._facingSign); },
			export: () => { return this._facingSign; },
			import: (obj : Object) => { this._facingSign = <number>obj; },
		});
		this.registerProp(Prop.HEAD_ANGLE, {
			has: () => { return defined(this._headAngle); },
			export: () => { return this._headAngle; },
			import: (obj : Object) => { this._headAngle = <number>obj; },
		});
		*/

	}

	override ready() : boolean {
		return super.ready() && this.hasClientId();
	}

	override initialize() : void {
		super.initialize();

		this._profile.setInertia(Infinity);
		// TODO: re-enable
		// this._profile.collider(Part.HEAD).setInertia(Infinity);

		if (this.clientId() === game.id()) {
			game.lakitu().setTargetEntity(this);
			game.keys().setTargetEntity(this);
		}

		if (game.options().host) {
			game.entities().addEntity(EntityType.BAZOOKA, {
				attributesInit: {
					attributes: new Map([
						[Attribute.OWNER, this.id()],
					]),
				},
			});
		}
	}

	equipWeapon(weapon : Weapon) : void {
		this._weapon = weapon;
		this._model.onLoad(() => {
			const arm = this._model.getBone(Bone.ARM);

			let weaponModel = <Model>this._weapon.getComponent(ComponentType.MODEL);
			weaponModel.onLoad((model) => {
				model.mesh().attachToBone(arm, this._model.mesh());
				model.mesh().rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
				model.mesh().scaling.z *= -1;
			});
		});
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		// Gravity
		this._profile.setAcc({ y: GameConstants.gravity });
		if (!this._attributes.get(Attribute.GROUNDED) && this._profile.vel().y < 0) {
			this._profile.addAcc({ y: (this._fallMultiplier - 1) * GameConstants.gravity });
		}

		if (game.keys(this.clientId()).keyDown(Key.INTERACT)) {
			this._attributes.setIf(Attribute.DEAD, true, game.options().host);
		} else {
			this._attributes.setIf(Attribute.DEAD, false, game.options().host);
		}

		this._deadTracker.check();

		if (!this._attributes.getOrDefault(Attribute.DEAD)) {
			// Keypress acceleration
			if (game.keys(this.clientId()).keyDown(Key.LEFT)) {
				this._profile.setAcc({ x: -this._sideAcc });
			} else if (game.keys(this.clientId()).keyDown(Key.RIGHT)) {
				this._profile.setAcc({ x: this._sideAcc });
			} else {
				this._profile.setAcc({ x: 0 });
			}

			if (game.options().host) {
				// Out of bounds
				if (this._profile.pos().y < -8) {
					this._profile.setPos({ x: 0, y: 10 });
					this._profile.setVel({ x: 0, y: 0 });
				}
			}

			// Set direction of player
			this._headAngle = this.computeHeadAngle();
			// TODO: re-enable
			// this._profile.collider(Part.HEAD).setAngle(this._headAngle);
			this._armAngle = this.computeArmAngle();

			// Turn acceleration
			const turning = Math.sign(this._profile.acc().x) === -Math.sign(this._profile.vel().x);
			if (turning) {
				this._profile.acc().x *= this._turnMultiplier;
			}

			// Jumping
			if (this._jumpTimer.hasTimeLeft()) {
				if (game.keys(this.clientId()).keyDown(Key.JUMP)) {
					this._profile.setVel({ y: this._jumpVel });
					this._jumpTimer.stop();
				}
			} else if (this._attributes.getOrDefault(Attribute.CAN_DOUBLE_JUMP) && game.keys(this.clientId()).keyPressed(Key.JUMP)) {
				this._profile.setVel({ y: this._jumpVel });
				this._attributes.setIf(Attribute.CAN_DOUBLE_JUMP, false, game.options().host);
			}
		}

		// Friction and air resistance
		const slowing = Math.sign(this._profile.acc().x) !== Math.sign(this._profile.vel().x);
		if (this._attributes.get(Attribute.GROUNDED)) {
			if (slowing) {
				this._profile.vel().x *= this._friction;
			}
		} else {
			if (this._profile.acc().x === 0) {
				this._profile.vel().x *= this._airResistance;
			}
		}

		// Max speed
		// TODO: set this in profile
		if (Math.abs(this._profile.vel().x) > this._maxHorizontalVel) {
			this._profile.vel().x *= this._maxVelMultiplier;
		}
		if (Math.abs(this._profile.vel().y) > this._maxVerticalVel) {
			this._profile.vel().y *= this._maxVelMultiplier;
		}
	}

	override update(millis : number) : void {
		super.update(millis);

		if (game.options().host && defined(this._weapon)) {
			if (game.keys(this.clientId()).keyDown(Key.MOUSE_CLICK)) {
				// TODO: stop recomputing arm angle all the time
				this._weapon.shoot(Vec2.unitFromRad(this.computeArmAngle()));
			}
		}
	}

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		this._attributes.setIf(Attribute.GROUNDED, false, game.options().host);
	}

	override collide(other : Entity, collision : MATTER.Collision) : void {
		super.collide(other, collision);

		if (this.id() === other.id()) {
			return;
		}

		const otherAttributes = <Attributes>other.getComponent(ComponentType.ATTRIBUTES);
		if (otherAttributes.getOrDefault(Attribute.SOLID) && collision.normal.y >= 0.5) {
			this._attributes.setIf(Attribute.GROUNDED, true, game.options().host);
			this._attributes.setIf(Attribute.CAN_DOUBLE_JUMP, true, game.options().host);
			this._jumpTimer.start(this._jumpGracePeriod);
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		if (!this._attributes.get(Attribute.GROUNDED) || this._attributes.get(Attribute.DEAD)) {
			this._model.playAnimation(Animation.JUMP);
		} else {
			if (Math.abs(this._profile.acc().x) < 0.01) {
				this._model.playAnimation(Animation.IDLE);
			} else {
				this._model.playAnimation(Animation.WALK);
			}
		}

		const dir = this.computeDir(this._profile.pos());
		let armature = this._model.getBone(Bone.ARMATURE).getTransformNode();
		armature.scaling.z = dir.x >= 0 ? 1 : -1;

		if (this.clientIdMatches()) {
			this._armAngle = this.computeArmAngle();
			this._headAngle = this.computeHeadAngle();
		}

		if (defined(this._armAngle)) {
			let arm = this._model.getBone(Bone.ARM);
			let armRotation = this._armAngle;
			if (dir.x >= 0) {
				armRotation -= Math.PI / 2;
			} else {
				armRotation = -armRotation + Math.PI / 2;
			}

			arm.getTransformNode().rotation = new BABYLON.Vector3(armRotation, Math.PI, 0);
		}
		if (defined(this._headAngle)) {
			let headRotation = this._headAngle;
			if (dir.x >= 0) {
				headRotation *= -1;
			} else {
				headRotation += Math.PI;
			}

			let neck = this._model.getBone(Bone.NECK);
			neck.getTransformNode().rotation = new BABYLON.Vector3(headRotation, neck.getTransformNode().rotation.y, neck.getTransformNode().rotation.z);
		}
	}

	// TODO: clean this up
	private computeDir(origin : Vec2) : Vec2 {
		if (!this.clientIdMatches()) {
			return game.keys(this.clientId()).dir();
		}
		return game.keys(this.clientId()).mouse().clone().sub(origin);
	}

	private computeHeadAngle() : number {
		const dir = this.computeDir(this._profile.pos());
		let rotation = dir.angleRad();

		if (dir.x >= 0) {
			if (dir.y < 0 && rotation < 7 / 4 * Math.PI) {
				rotation = 7 / 4 * Math.PI;
			} else if (dir.y > 0 && rotation > Math.PI / 4) {
				rotation = Math.PI / 4;
			}
		} else {
			rotation = Funcs.clamp(3 / 4 * Math.PI, rotation, 5 / 4 * Math.PI);
		}
		return rotation;
	}

	private computeArmAngle() : number {
		if (!this._model.hasMesh()) {
			return 0;
		}

		// Set direction of arm
		const pos = Vec2.fromBabylon3(this._model.getBone(Bone.ARM).getTransformNode().getAbsolutePosition());
		const dir = this.computeDir(pos);
		return dir.angleRad();
	}
}