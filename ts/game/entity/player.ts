import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameState } from 'game/api'
import { StepData } from 'game/game_object'
import { AssociationType, AttributeType, ComponentType, ModifierType, ModifierPlayerType, StatType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Modifiers } from 'game/component/modifiers'
import { Profile } from 'game/component/profile'
import { StatInitOptions } from 'game/component/stat'
import { Stats } from 'game/component/stats'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Weapon } from 'game/entity/weapon'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { BodyFactory } from 'game/factory/body_factory'
import { CollisionInfo } from 'game/util/collision_info'

import { GameGlobals } from 'global/game_globals'

import { PlayerProp } from 'message/player_message'

import { KeyType, CounterType } from 'ui/api'

import { Buffer } from 'util/buffer'
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

export class Player extends EntityBase implements Entity, EquipEntity {
	// blockdudes3 = 18.0
	private static readonly _sideAcc = 0.6;
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

	private static readonly _armRecoveryTime = 500;

	private readonly _moveAnimations = new Set<string>([
		Animation.IDLE, Animation.WALK, Animation.JUMP
	]);
	private readonly _controllableBones = new Set<string>([
		Bone.ARM, Bone.ARMATURE, Bone.NECK, Bone.SPINE,
	]);

	// TODO: package in struct, Pose, PlayerPose?
	private _armDir : Vec2;
	private _armRecoil : number;
	private _headDir : Vec2;
	private _boneOrigins : Map<Bone, BABYLON.Vector3>;
	private _collisionInfo : CollisionInfo

	// TODO: create state machine with mutually exclusive set of states?
	// TODO: deactivated to GameObject
	private _deactivated : boolean;
	private _jumpTimer : Timer;
	private _canDoubleJump : boolean;
	private _deadTracker : ChangeTracker<boolean>;
	private _spawn : Vec;
	private _respawnTimer : Timer;

	private _equips : Array<number>;
	private _equip : Equip<Player>;
	private _altEquip : Equip<Player>;

	private _attributes : Attributes;
	private _model : Model;
	private _modifiers : Modifiers;
	private _profile : Profile;
	private _stats : Stats;
	private _headSubProfile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLAYER, entityOptions);

		this.setName({
			base: "player",
			id: this.id(),
		});

		this._armDir = Vec2.i();
		this._armRecoil = 0;
		this._headDir = Vec2.i();
		this._boneOrigins = new Map();
		this._collisionInfo = new CollisionInfo();

		this._deactivated = false;
		this._jumpTimer = this.newTimer();
		this._canDoubleJump = true;
		this._deadTracker = new ChangeTracker(() => {
			return this._stats.dead();
		}, (dead : boolean) => {
			if (dead) {
				const x = this._profile.vel().x;
				const sign = x >= 0 ? -1 : 1;

				this._profile.resetInertia();
				this._profile.setAngularVelocity(sign * Math.max(0.3, Math.abs(x)));
				this._profile.setAcc({x: 0});

				if (game.controller().gameState() === GameState.WAITING) {
					this._respawnTimer.start(Player._respawnTime, () => {
						this.respawn();
					});
				}
			} else {
				this._profile.setInertia(Infinity);
				this._profile.setAngularVelocity(0);
			}
		});
		this._spawn = {x: 0, y: 0};
		this._respawnTimer = this.newTimer();
		this._equips = new Array();

		this.addProp<boolean>({
			export: () => { return this._canDoubleJump; },
			import: (obj : boolean) => { this._canDoubleJump = obj; },
		});
		this.addProp<boolean>({
			export: () => { return this._deactivated; },
			import: (obj : boolean) => { this._deactivated = obj; },
		});
		this.addProp<Array<number>>({
			export: () => { return this._equips; },
			import: (obj : Array<number>) => { this._equips = obj; },
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.GROUNDED, false);
		this._attributes.setAttribute(AttributeType.SOLID, true);

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

		this._headSubProfile = this._profile.addSubComponent<Profile>(SubProfile.HEAD, new Profile({
			readyFn: (head : Profile) => { return this._profile.initialized(); },
			bodyFn: (head : Profile) => {
				return BodyFactory.rectangle(head.pos(), head.dim(), {
					isSensor: true,
					collisionFilter: {
						group: collisionGroup,
					},
					render: {
						visible: false,
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

					this._controllableBones.forEach((name : string) => {
						if (!model.hasBone(name)) {
							console.error("Error: missing bone %s for %s", name, this.name());
							return;
						}
						const bone = <Bone>name;
						this._boneOrigins.set(bone, model.getBone(bone).getTransformNode().position);
					})

					// TODO: this doesn't seem to work
					let animationProperties = new BABYLON.AnimationPropertiesOverride();
					animationProperties.enableBlending = true;
					animationProperties.blendingSpeed = 2;
					result.skeletons[0].animationPropertiesOverride = animationProperties;

					model.setMesh(mesh);
				});
			},
		}));

		this._modifiers = new Modifiers();
		this._stats = this.addComponent<Stats>(new Stats({ stats: new Map<StatType, StatInitOptions>([
			[StatType.HEALTH, {
				stat: 100,
				min: 0,
				max: 100,
			}]
		])}));
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
		}
		game.keys(this.clientId()).setTargetEntity(this);

		this.updateLoadout();
	}

	setSpawn(spawn : Vec) : void { this._spawn = spawn; }
	respawn() : void {
		this._profile.setPos(this._spawn);
		this._profile.uprightStop();
		this._profile.setInertia(Infinity);
		this.updateLoadout();

		this._stats.reset();
		this._stats.processComponent<Modifiers>(this._modifiers);
		this._profile.processComponent<Stats>(this._stats);
	}
	setDeactivated(deactivated : boolean) : void { this._deactivated = deactivated; }
	dead() : boolean { return this._stats.dead(); }

	equip(equip : Equip<Player>) : void {
		this._equips.push(equip.id());
		this._model.onLoad((m : Model) => {
			switch(equip.attachType()) {
			case AttachType.ARM:
				const arm = m.getBone(Bone.ARM);
				let equipModel = equip.getComponent<Model>(ComponentType.MODEL);
				equipModel.onLoad((wm : Model) => {
					wm.mesh().attachToBone(arm, m.mesh());
					wm.mesh().rotation = new BABYLON.Vector3(3 * Math.PI / 2, 0, Math.PI);

					let armature = this._model.getBone(Bone.ARMATURE).getTransformNode();
					wm.mesh().scaling.y *= Math.sign(armature.scaling.z);
					wm.mesh().scaling.z *= Math.sign(armature.scaling.z);
				});
				break;
			}
		});
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (this.isSource()) {
			// Out of bounds
			if (this._profile.pos().y < -8) {
				this.takeDamage(this._stats.health(), this);
			}
			this._attributes.setAttribute(AttributeType.GROUNDED, this._jumpTimer.hasTimeLeft());
		}

		this._deadTracker.check();
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;
		const seqNum = stepData.seqNum;

		if (this._deactivated) {
			this._profile.uprightStop();
			return;
		}

		// Gravity
		let gravity = GameGlobals.gravity;
		if (!this._attributes.getAttribute(AttributeType.GROUNDED) && this._profile.vel().y < 0) {
			gravity += (Player._fallMultiplier - 1) * GameGlobals.gravity;
		}
		this._profile.setAcc({ y: gravity });

		const keys = game.keys(this.clientId());
		if (!this._stats.dead()) {
			// Keypress acceleration
			if (keys.keyDown(KeyType.LEFT, seqNum)) {
				this._profile.setAcc({ x: -Player._sideAcc });
			} else if (keys.keyDown(KeyType.RIGHT, seqNum)) {
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
			const dir = keys.dir();
			this.recomputeDir(dir);
			this._headSubProfile.setAngle(this._headDir.angleRad());

			// Jumping
			if (this._jumpTimer.hasTimeLeft()) {
				if (keys.keyDown(KeyType.JUMP, seqNum)) {
					this._profile.setVel({ y: Player._jumpVel });
					this._jumpTimer.stop();
				}
			} else if (this._canDoubleJump) {
				if (keys.keyPressed(KeyType.JUMP, seqNum)) {
					this._profile.setVel({ y: Player._jumpVel });
					this._canDoubleJump = false;
				}
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

		if (this._model.hasMesh()) {
			if (this.isSource()) {
				this._equips.forEach((id : number) => {
					const [equip, hasEquip] = game.entities().getEntity<Equip<Player>>(id);
					if (hasEquip) {
						equip.updateInput({
							keys: this._stats.dead() ? new Set() : keys.keys(seqNum),
							millis: millis,
							mouse: keys.mouse(),
							dir: this._armDir,
						});
					}
				});
			}
		}

		// Cosmetic stuff
		if (this._armRecoil > 0) {
			this._armRecoil -= Math.abs(millis / Player._armRecoveryTime);
			if (this._armRecoil < 0) {
				this._armRecoil = 0;
			}
		}
	}

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		this._collisionInfo.resetAndSnapshot(this._profile);
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (collision.pair.bodyA.isSensor || collision.pair.bodyB.isSensor) {
			return;
		}

		if (!other.getAttribute(AttributeType.SOLID)) {
			return;
		}

		this._collisionInfo.pushRecord({
			penetration: Vec2.fromVec(collision.penetration),
			normal: Vec2.fromVec(collision.normal),
		});
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		let resolvedVel = Vec2.fromVec(this._collisionInfo.vel());
		while (this._collisionInfo.hasRecord()) {
			const record = this._collisionInfo.popRecord();
			const pen = record.penetration;
			const normal = record.normal;

			if (!pen.isZero()) {
				// Check if we should use updated velocity.
				if (Math.abs(pen.x) > 1e-6) {
					resolvedVel.x = this._profile.vel().x;
				}
				if (Math.abs(pen.y) > 1e-6) {
					resolvedVel.y = this._profile.vel().y;
				}
			}

			if (normal.y > 0.5) {
				this._canDoubleJump = true;
				this._jumpTimer.start(Player._jumpGracePeriod);
			}
		}
		this._profile.setVel(resolvedVel);
		MATTER.Body.setVelocity(this._profile.body(), this._profile.vel());
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		// Perform any required actions when using equips
		this._equips.forEach((id : number) => {
			const [equip, hasEquip] = game.entities().getEntity<Equip<Player>>(id);
			if (hasEquip && equip.hasUse()) {
				switch(equip.attachType()) {
				case AttachType.ARM:
					this._armRecoil = equip.recoilType();
					break;
				}
				equip.consumeUses();
			}
		});

		if (!this._attributes.getAttribute(AttributeType.GROUNDED) || this._stats.dead()) {
			this._model.playAnimation(Animation.JUMP);
		} else {
			if (Math.abs(this._profile.acc().x) < 0.01) {
				this._model.playAnimation(Animation.IDLE);
			} else {
				this._model.playAnimation(Animation.WALK);
			}
		}

		if (this.clientIdMatches() && !this._stats.dead()) {
			this.recomputeDir(game.keys(this.clientId()).dir());
		}
		let armature = this._model.getBone(Bone.ARMATURE).getTransformNode();
		armature.scaling.z = Math.sign(this._headDir.x);

		let neckAngle = this._headDir.angleRad();
		if (armature.scaling.z > 0) {
			neckAngle *= -1;
		} else {
			neckAngle += Math.PI;
		}
		let neck = this._model.getBone(Bone.NECK).getTransformNode();
		neck.rotation = new BABYLON.Vector3(neckAngle, neck.rotation.y, neck.rotation.z);

		// Compute arm rotation
		let arm = this._model.getBone(Bone.ARM).getTransformNode();
		let armRotation = this._armDir.angleRad();
		if (armature.scaling.z > 0) {
			armRotation -= Math.PI / 2;
		} else {
			armRotation = -armRotation + Math.PI / 2;
		}
		arm.rotation = new BABYLON.Vector3(armRotation, Math.PI, 0);

		// Compute arm position
		let rotatedOffset = new BABYLON.Vector3(0, -Math.cos(armRotation) * this._armRecoil, Math.sin(armRotation) * this._armRecoil);
		arm.position = this._boneOrigins.get(Bone.ARM).add(rotatedOffset);
	}

	override getCounts() : Map<CounterType, number> {
		let counts = new Map<CounterType, number>();
		counts.set(CounterType.HEALTH, this._stats.health());
		this._equips.forEach((id : number) => {
				const [equip, hasEquip] = game.entities().getEntity<Equip<Player>>(id);
				if (hasEquip) {
					equip.getCounts().forEach((count : number, type : CounterType) => {
						counts.set(type, count);
					});
				}
		});
		return counts;
	}

	private updateLoadout() : void {
		this._model.onLoad(() => {
			const loadout = game.clientState(this.clientId()).loadoutMsg();

			this._modifiers.setModifier(ModifierType.PLAYER_TYPE, loadout.getProp<ModifierPlayerType>(PlayerProp.TYPE));

			if (defined(this._equip)) {
				this._equip.delete();
			}

			// TODO: add levelVersion to equips
			let hasEquip;
			[this._equip, hasEquip] = this.addTrackedEntity<Equip<Player>>(loadout.getProp<EntityType>(PlayerProp.EQUIP_TYPE), {
				associationInit: {
					owner: this,
				},
				levelVersion: game.level().version(),
			});
			if (hasEquip) {
				this._equip.addKey(KeyType.MOUSE_CLICK);
			}

			if (defined(this._altEquip)) {
				this._altEquip.delete();
			}
			let hasAltEquip;
			[this._altEquip, hasAltEquip] = this.addTrackedEntity<Equip<Player>>(loadout.getProp<EntityType>(PlayerProp.ALT_EQUIP_TYPE), {
				associationInit: {
					owner: this,
				},
				levelVersion: game.level().version(),
			});		
			if (hasAltEquip) {
				this._altEquip.addKey(KeyType.ALT_MOUSE_CLICK);
			}
		});
	}

	private recomputeDir(dir : Vec2) : void {
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

		this._armDir.copy(dir).normalize();

	}
}