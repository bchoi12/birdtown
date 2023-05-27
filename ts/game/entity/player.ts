import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameConstants } from 'game/api'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Health } from 'game/component/health'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { Weapon } from 'game/entity/weapon'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { BodyFactory } from 'game/factory/body_factory'

import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { KeyType, CounterType } from 'ui/api'

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
	private static readonly _minSpeed = 1e-3;

	private static readonly _turnMultiplier = 3.0;
	private static readonly _fallMultiplier = 1.5;

	private static readonly _friction = 24;
	private static readonly _airResistance = 6;

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

	private _deactivated : boolean;
	private _jumpTimer : Timer;
	private _canDoubleJump : boolean;
	private _deadTracker : ChangeTracker<boolean>;
	private _spawn : Vec;
	private _respawnTimer : Timer;
	private _equips : Map<KeyType, Equip>;

	private _attributes : Attributes;
	private _health : Health;
	private _model : Model;
	private _profile : Profile;
	private _headSubProfile : Profile;


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

		this._deactivated = false;
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
				this._profile.setAcc({x: 0});
			} else {
				this._profile.setInertia(Infinity);
				this._profile.setAngularVelocity(0);
			}
		});
		this._spawn = {x: 0, y: 0};
		this._respawnTimer = this.newTimer();
		this._equips = new Map();

		this.addProp<boolean>({
			export: () => { return this._canDoubleJump; },
			import: (obj : boolean) => { this._canDoubleJump = obj; },
		});
		this.addProp<boolean>({
			export: () => { return this._deactivated; },
			import: (obj : boolean) => { this._deactivated = obj; },
		})

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.GROUNDED, false);
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._health = this.addComponent<Health>(new Health({ health: 100 }));

		const collisionGroup = MATTER.Body.nextGroup(/*ignoreCollisions=*/true);
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
		this._profile.setAngle(0);
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});
		this._profile.setMaxSpeed({
			maxSpeed: {x: Player._maxHorizontalVel, y: Player._maxVerticalVel },
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
				MATTER.Body.setPosition(head.body(), this._profile.pos().clone().add({y: 0.22}));
			},
		}));
		this._headSubProfile.setAngle(0);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.CHICKEN, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
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
					animationProperties.blendingSpeed = 2;
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

		this._model.onLoad(() => {
			this.addTrackedEntity(EntityType.BAZOOKA, {
				attributesInit: {
					attributes: new Map([
						[AttributeType.OWNER, this.id()],
					]),
				},
			});
		})
	}

	setSpawn(spawn : Vec) : void { this._spawn = spawn; }
	respawn() : void {
		this._health.reset();
		this._profile.setPos(this._spawn);
		this._profile.stop();
		this._profile.setInertia(Infinity);
	}
	setDeactivated(deactivated : boolean) : void { this._deactivated = deactivated; }
	dead() : boolean { return this._health.dead(); }

	// TODO: fix race condition where weapon is loaded upside-down
	equip(key : KeyType, weapon : Weapon) : void {
		this._equips.set(key, weapon);
		this._model.onLoad((m : Model) => {
			const arm = m.getBone(Bone.ARM);

			let weaponModel = weapon.getComponent<Model>(ComponentType.MODEL);
			weaponModel.onLoad((wm : Model) => {
				wm.mesh().attachToBone(arm, m.mesh());
				wm.mesh().rotation = new BABYLON.Vector3(Math.PI / 2, 0, 0);
				wm.mesh().scaling.z *= -1;
			});
		});

		// TODO: put this somewhere that makes sense
		const [brain, hasBrain] = this.addTrackedEntity<Equip>(EntityType.BIRD_BRAIN, {
			attributesInit: {
				attributes: new Map([
					[AttributeType.OWNER, this.id()],
				]),
			},
		});
		if (hasBrain) {
			this._equips.set(KeyType.ALT_MOUSE_CLICK, brain)
		}
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (this.isSource()) {
			// Out of bounds
			if (this._profile.pos().y < -8) {
				this.takeDamage(1000);
			}
			this._attributes.setAttribute(AttributeType.GROUNDED, this._jumpTimer.hasTimeLeft());
		}

		this._deadTracker.check();
	}

	override update(millis : number) : void {
		super.update(millis);

		if (this._deactivated) {
			this._profile.stop();
			return;
		}

		// Gravity
		let gravity = GameConstants.gravity;
		if (!this._attributes.getAttribute(AttributeType.GROUNDED) && this._profile.vel().y < 0) {
			gravity += (Player._fallMultiplier - 1) * GameConstants.gravity;
		}
		this._profile.setAcc({ y: gravity });

		if (!this._health.dead()) {
			// Keypress acceleration
			if (game.keys(this.clientId()).keyDown(KeyType.LEFT)) {
				this._profile.setAcc({ x: -Player._sideAcc });
			} else if (game.keys(this.clientId()).keyDown(KeyType.RIGHT)) {
				this._profile.setAcc({ x: Player._sideAcc });
			} else {
				this._profile.setAcc({ x: 0 });
			}

			// Turn acceleration
			const turning = Math.sign(this._profile.acc().x) === -Math.sign(this._profile.vel().x);
			if (turning) {
				this._profile.acc().x *= Player._turnMultiplier;
			}

			// Compute head and arm directions
			this.recomputeHeadDir();
			this.recomputeArmDir();
			this._headSubProfile.setAngle(this._headDir.angleRad());

			// Jumping
			if (this._jumpTimer.hasTimeLeft()) {
				if (game.keys(this.clientId()).keyDown(KeyType.JUMP)) {
					this._profile.setVel({ y: Player._jumpVel });
					this._jumpTimer.stop();
				}
			} else if (this._canDoubleJump) {
				if (game.keys(this.clientId()).keyPressed(KeyType.JUMP)) {
					this._profile.setVel({ y: Player._jumpVel });
					this._canDoubleJump = false;
				}
			}

			if (this.isSource()) {
				this._equips.forEach((equip : Equip, key : KeyType) => {
					if (game.keys(this.clientId()).keyDown(key)) {
						equip.use(this._armDir);
					} else {
						equip.release(this._armDir);
					}
				});
			}
		}

		// Friction and air resistance
		if (Math.abs(this._profile.vel().x) < Player._minSpeed) {
			this._profile.setVel({x: 0});
		} else if (Math.sign(this._profile.acc().x) !== Math.sign(this._profile.vel().x)) {
			let sideVel = this._profile.vel().x;
			if (this._attributes.getAttribute(AttributeType.GROUNDED)) {
				sideVel *= 1 / (1 + Player._friction * millis / 1000);
			} else {
				sideVel *= 1 / (1 + Player._airResistance * millis / 1000);
			}
			this._profile.setVel({x: sideVel });
		}
	}

	override prePhysics(millis : number) : void {
		super.prePhysics(millis);

		this._totalPenetration.scale(0);
		this._maxNormal.scale(0);
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this.id() === other.id()) {
			return;
		}

		if (collision.pair.bodyA.isSensor || collision.pair.bodyB.isSensor) {
			return;
		}

		if (!other.hasComponent(ComponentType.ATTRIBUTES) || !other.hasComponent(ComponentType.PROFILE)) {
			return;
		}

		const otherAttributes = other.getComponent<Attributes>(ComponentType.ATTRIBUTES);
		if (!otherAttributes.getAttribute(AttributeType.SOLID)) {
			return;
		}

		const otherProfile = other.getComponent<Profile>(ComponentType.PROFILE);

		const pos = this._profile.pos();
		const dim = this._profile.dim();
		const vel = this._profile.vel();
		const normal = collision.normal;

		let pen = Vec2.fromVec(collision.penetration);
		let overlap = pos.clone().sub(otherProfile.pos()).abs();
		if (Math.abs(normal.x) > 0.99 || Math.abs(normal.y) > 0.99) {
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
		this._totalPenetration.add(pen)

		if (pen.x > 0 || pen.lengthSq() === 0) {
			this._maxNormal.x = Math.max(this._maxNormal.x, Math.abs(normal.x));
		}

		if (pen.y > 0 || pen.lengthSq() === 0) {
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

		if (!this._attributes.getAttribute(AttributeType.GROUNDED) || this._health.dead()) {
			this._model.playAnimation(Animation.JUMP);
		} else {
			if (Math.abs(this._profile.acc().x) < 0.01) {
				this._model.playAnimation(Animation.IDLE);
			} else {
				this._model.playAnimation(Animation.WALK);
			}
		}

		if (this.clientIdMatches() && !this._health.dead()) {
			this.recomputeArmDir();
			this.recomputeHeadDir();
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

	override getCounts() : Array<UiMessage> {
		const healthMsg = new UiMessage(UiMessageType.COUNTER);
		healthMsg.setProp(UiProp.TYPE, CounterType.HEALTH);
		healthMsg.setProp(UiProp.COUNT, this._health.health());

		const juiceMsg = new UiMessage(UiMessageType.COUNTER);
		juiceMsg.setProp(UiProp.TYPE, CounterType.JUICE);

		if (this._equips.has(KeyType.ALT_MOUSE_CLICK)) {
			juiceMsg.setProp(UiProp.COUNT, this._equips.get(KeyType.ALT_MOUSE_CLICK).juice());
		} else {
			juiceMsg.setProp(UiProp.COUNT, 100);
		}
		return [healthMsg, juiceMsg];
	}

	private recomputeHeadDir() : void {
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
		this._headDir.normalize();
	}

	private recomputeArmDir() : void {
		const dir = game.keys(this.clientId()).dir();

		this._armDir.copy(dir).normalize();
	}
}