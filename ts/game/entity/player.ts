import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
import { Health } from 'game/component/health'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { GameConstants } from 'game/core'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { Weapon } from 'game/entity/weapon'
import { loader, LoadResult, MeshType } from 'game/loader'
import { BodyFactory } from 'game/factory/body_factory'

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

enum SubProfile {
	UNKNOWN,
	HEAD,
}

enum Constraint {
	UNKNOWN,
	NECK,
}

export class Player extends EntityBase {
	// blockdudes3 = 18.0
	private static readonly _sideAcc = 1.0;
	private static readonly _jumpVel = 0.3;
	private static readonly _maxHorizontalVel = 0.25;
	private static readonly _maxVerticalVel = 0.6;
	private static readonly _maxVelMultiplier = 0.2;

	private static readonly _turnMultiplier = 3.0;
	private static readonly _fallMultiplier = 1.5;

	private static readonly _friction = 0.7;
	private static readonly _airResistance = 0.9;

	private static readonly _rotationOffset = -0.1;
	private static readonly _jumpGracePeriod = 100;
	private static readonly _respawnTime = 2000;

	private readonly _moveAnimations = new Set<string>([
		Animation.IDLE, Animation.WALK, Animation.JUMP
	]);
	private readonly _controllableBones = new Set<string>([
		Bone.ARM, Bone.ARMATURE, Bone.NECK, Bone.SPINE,
	]);

	private _armDir : Vec2;
	private _headDir : Vec2;
	private _totalPenetration : Vec2;
	private _maxNormal : Vec2;

	private _jumpTimer : Timer;
	private _canDoubleJump : boolean;
	private _deadTracker : ChangeTracker<boolean>;
	private _respawnTimer : Timer;

	private _attributes : Attributes;
	private _health : Health;
	private _model : Model;
	private _profile : Profile;
	private _headSubProfile : Profile;

	private _weapon : Weapon;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLAYER, entityOptions);

		this.setName({
			base: "player",
			id: this.id(),
		});

		this._armDir = Vec2.i();
		this._headDir = Vec2.i();
		this._totalPenetration = Vec2.zero();
		this._maxNormal = Vec2.zero();

		this._jumpTimer = this.newTimer();
		this._canDoubleJump = true;
		this._deadTracker = new ChangeTracker(() => {
			return this._health.dead();
		}, (dead : boolean) => {
			if (dead) {
				const x = this._profile.vel().x;
				const sign = x >= 0 ? -1 : 1;

				this._profile.resetInertia();
				this._profile.setAngularVelocity(sign * Math.max(0.1, Math.abs(x)));
				this._profile.setAcc({x: 0, y: 0});
				this._respawnTimer.start(Player._respawnTime, () => {
					this.respawn();
				});
			}
		});
		this._respawnTimer = this.newTimer();

		this.registerProp(this.numProps() + 1, {
			export: () => { return this._canDoubleJump; },
			import: (obj : Object) => { this._canDoubleJump = <boolean>obj; },
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.set(Attribute.GROUNDED, false);
		this._attributes.set(Attribute.SOLID, true);

		this._health = this.addComponent<Health>(new Health({ health: 100 }));

		const collisionGroup = MATTER.Body.nextGroup(true);
		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				const pos = profile.pos();
				const dim = profile.dim();

				return BodyFactory.rectangle(profile.pos(), profile.dim(), {
					friction: 0,
					collisionFilter: {
						group: collisionGroup,
					},
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setDim({x: 0.8, y: 1.44 });
		this._profile.setAngle(0);
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});
		this._profile.setMaxSpeed({
			maxSpeed: {x: Player._maxHorizontalVel, y: Player._maxVerticalVel },
			multiplier: {x: Player._maxVelMultiplier, y: Player._maxVelMultiplier },
		});

		this._headSubProfile = this._profile.addSubProfile(SubProfile.HEAD, new Profile({
			readyFn: (head : Profile) => { return this._profile.initialized(); },
			bodyFn: (head : Profile) => {
				return BodyFactory.rectangle(head.pos(), head.dim(), {
					isSensor: true,
					collisionFilter: {
						group: collisionGroup,
					},
				});
			},
			init: {
				pos: {x: 0, y: 0},
				dim: {x: 0.96, y: 1.06},
			},
			prePhysicsFn: (head : Profile) => {
				head.setPos(this._profile.pos().clone().add({y: 0.22}));
			},
			postPhysicsFn: (head : Profile) => {
				head.setPos(this._profile.pos().clone().add({y: 0.22}));
			},
		}));
		this._headSubProfile.setAngle(0);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				loader.load(MeshType.CHICKEN, (result : LoadResult) => {
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
					armature.rotation = new BABYLON.Vector3(0, Math.PI / 2 + Player._rotationOffset, 0);
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
	}

	override ready() : boolean {
		return super.ready() && this.hasClientId();
	}

	override initialize() : void {
		super.initialize();

		this._profile.setInertia(Infinity);
		this._headSubProfile.setInertia(Infinity);

		if (this.clientIdMatches()) {
			game.lakitu().setTargetEntity(this);
			game.keys(this.clientId()).setTargetEntity(this);
		}

		game.entities().addEntity(EntityType.BAZOOKA, {
			attributesInit: {
				attributes: new Map([
					[Attribute.OWNER, this.id()],
				]),
			},
		});
	}

	respawn() : void {
		this._health.reset();

		this._profile.setPos({x: 0, y: 10});
		this._profile.stop();
		this._profile.setAngle(0);
		this._profile.setAngularVelocity(0);
		this._profile.setInertia(Infinity);
	}

	// TODO: fix race condition where weapon is loaded upside-down
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

		if (game.options().host) {
			// Out of bounds
			if (this._profile.pos().y < -8) {
				this.takeDamage(1000);
			}
		}
		this._attributes.setIfHost(Attribute.GROUNDED, this._jumpTimer.hasTimeLeft());
		this._deadTracker.check();

		// Gravity
		this._profile.setAcc({ y: GameConstants.gravity });
		if (!this._attributes.get(Attribute.GROUNDED) && this._profile.vel().y < 0) {
			this._profile.addAcc({ y: (Player._fallMultiplier - 1) * GameConstants.gravity });
		}

		if (!this._health.dead()) {
			// Keypress acceleration
			if (game.keys(this.clientId()).keyDown(Key.LEFT)) {
				this._profile.setAcc({ x: -Player._sideAcc });
			} else if (game.keys(this.clientId()).keyDown(Key.RIGHT)) {
				this._profile.setAcc({ x: Player._sideAcc });
			} else {
				this._profile.setAcc({ x: 0 });
			}

			// Set direction of player
			this._headDir = this.computeHeadDir();
			this._armDir = this.computeArmDir();

			// Turn acceleration
			const turning = Math.sign(this._profile.acc().x) === -Math.sign(this._profile.vel().x);
			if (turning) {
				this._profile.acc().x *= Player._turnMultiplier;
			}

			// Jumping
			if (this._jumpTimer.hasTimeLeft()) {
				if (game.keys(this.clientId()).keyDown(Key.JUMP)) {
					this._profile.setVel({ y: Player._jumpVel });
					this._jumpTimer.stop();
				}
			} else if (this._canDoubleJump) {
				if (game.keys(this.clientId()).keyPressed(Key.JUMP)) {
					this._profile.setVel({ y: Player._jumpVel });
					this._canDoubleJump = false;
				}
			}
		}

		// Friction and air resistance
		const slowing = Math.sign(this._profile.acc().x) !== Math.sign(this._profile.vel().x);
		if (this._attributes.get(Attribute.GROUNDED)) {
			if (slowing) {
				this._profile.vel().x *= Player._friction;
			}
		} else {
			if (this._profile.acc().x === 0) {
				this._profile.vel().x *= Player._airResistance;
			}
		}
	}

	override update(millis : number) : void {
		super.update(millis);

		if (game.options().host && defined(this._weapon)) {
			if (game.keys(this.clientId()).keyDown(Key.MOUSE_CLICK)) {
				this._weapon.shoot(this._armDir);
			}
		}
	}

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		this._headSubProfile.setAngle(this._headDir.angleRad());
		this._totalPenetration.scale(0);
		this._maxNormal.scale(0);
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this.id() === other.id()) {
			return;
		}

		if (!other.hasComponent(ComponentType.ATTRIBUTES) || !other.hasComponent(ComponentType.PROFILE)) {
			return;
		}

		const otherAttributes = other.getComponent<Attributes>(ComponentType.ATTRIBUTES);
		if (!otherAttributes.getOrDefault(Attribute.SOLID)) {
			return;
		}

		const otherProfile = other.getComponent<Profile>(ComponentType.PROFILE);

		const pos = this._profile.pos();
		const dim = this._profile.dim();
		const vel = this._profile.vel();
		const normal = collision.normal;

		let pen = Vec2.fromVec(collision.penetration);
		if (Math.abs(normal.x) > 0.99 || Math.abs(normal.y) > 0.99) {
			let overlap = pos.clone().sub(otherProfile.pos()).abs();
			overlap.sub({
				x: dim.x / 2 + otherProfile.dim().x / 2,
				y: dim.y / 2 + otherProfile.dim().y / 2,
			});
			overlap.negate();

			const xCollision = Math.abs(overlap.x * vel.y) < Math.abs(overlap.y * vel.x);
			if (xCollision) {
				// Either overlap in other dimension is too small or collision direction is in disagreement.
				if (Math.abs(overlap.y) < 1e-3 || Math.abs(normal.y) > 0.99) {
					pen.scale(0);
				}
			} else {
				if (Math.abs(overlap.x) < 1e-3 || Math.abs(normal.x) > 0.99) {
					pen.scale(0);
				}
			}
		}

		pen.abs();
		if (pen.lengthSq() > 0) {
			this._totalPenetration.add(pen)
			this._maxNormal.x = Math.max(this._maxNormal.x, Math.abs(normal.x));
			this._maxNormal.y = Math.max(this._maxNormal.y, normal.y);
		}
	}

	override postPhysics(millis : number) : void {
		super.postPhysics(millis);

		if (this._totalPenetration.lengthSq() > 0) {
			if (this._totalPenetration.x > 1e-6) {
				this._profile.setVel({ y: this._profile.body().velocity.y });
			}
			if (this._totalPenetration.y > 1e-6) {
				this._profile.setVel({ x: this._profile.body().velocity.x });
			}
			MATTER.Body.setVelocity(this._profile.body(), this._profile.vel());
		}

		if (this._maxNormal.y > 0.5) {
			this._canDoubleJump = true;
			this._jumpTimer.start(Player._jumpGracePeriod);			
		}
	}

	override preRender(millis : number) : void {
		super.preRender(millis);

		if (!this._model.hasMesh()) {
			return;
		}

		if (!this._attributes.get(Attribute.GROUNDED) || this._health.dead()) {
			this._model.playAnimation(Animation.JUMP);
		} else {
			if (Math.abs(this._profile.acc().x) < 0.01) {
				this._model.playAnimation(Animation.IDLE);
			} else {
				this._model.playAnimation(Animation.WALK);
			}
		}

		if (this.clientIdMatches() && !this._health.dead()) {
			this._armDir = this.computeArmDir();
			this._headDir = this.computeHeadDir();
		}
		const armature = this._model.getBone(Bone.ARMATURE).getTransformNode();
		armature.scaling.z = Math.sign(this._headDir.x);

		let neckAngle = this._headDir.angleRad();
		if (armature.scaling.z > 0) {
			neckAngle *= -1;
		} else {
			neckAngle += Math.PI;
		}
		let neck = this._model.getBone(Bone.NECK).getTransformNode();
		neck.rotation = new BABYLON.Vector3(neckAngle, neck.rotation.y, neck.rotation.z);

		let armRotation = this._armDir.angleRad();
		if (armature.scaling.z > 0) {
			armRotation -= Math.PI / 2;
		} else {
			armRotation = -armRotation + Math.PI / 2;
		}
		let arm = this._model.getBone(Bone.ARM).getTransformNode();
		arm.rotation = new BABYLON.Vector3(armRotation, Math.PI, 0);
	}

	private computeHeadDir() : Vec2 {
		const dir = game.keys(this.clientId()).dir();

		if (Math.sign(dir.x) !== Math.sign(this._headDir.x)) {
			if (Math.abs(dir.x) > 0.2) {
				this._headDir.copy(dir);
			}
		} else {
			this._headDir.copy(dir);
		}

		if (Math.abs(this._headDir.x) < .707) {
			this._headDir.x = Math.sign(this._headDir.x);
			this._headDir.y = Math.sign(this._headDir.y);
		}

		return this._headDir.normalize();
	}

	private computeArmDir() : Vec2 {
		if (!this._model.hasMesh()) {
			return Vec2.i();
		}

		if (!this.clientIdMatches()) { return game.keys(this.clientId()).dir().clone(); }

		const pos = Vec2.fromBabylon3(this._model.getBone(Bone.ARM).getTransformNode().getAbsolutePosition());
		return game.keys(this.clientId()).mouse().clone().sub(pos).normalize();
	}
}