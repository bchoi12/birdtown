import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameState, GameObjectState } from 'game/api'
import { StepData } from 'game/game_object'
import { AssociationType, AttributeType, ComponentType, CounterType, ModifierType, ModifierPlayerType, StatType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { EntityTrackers } from 'game/component/entity_trackers'
import { Expression } from 'game/component/expression'
import { Model } from 'game/component/model'
import { Modifiers } from 'game/component/modifiers'
import { Profile } from 'game/component/profile'
import { StatInitOptions } from 'game/component/stat'
import { Stats } from 'game/component/stats'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Crate } from 'game/entity/crate'
import { Equip, AttachType } from 'game/entity/equip'
import { Beak } from 'game/entity/equip/beak'
import { Bubble } from 'game/entity/equip/bubble'
import { Headwear } from 'game/entity/equip/headwear'
import { NameTag } from 'game/entity/equip/name_tag'
import { Weapon } from 'game/entity/equip/weapon'
import { CollisionCategory, MeshType, TextureType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { TextureFactory } from 'game/factory/texture_factory'
import { DepthType } from 'game/system/api'
import { RecordType } from 'game/util/collision_buffer'
import { MaterialShifter } from 'game/util/material_shifter'

import { GameGlobals } from 'global/game_globals'

import { DialogType, KeyType, KeyState } from 'ui/api'

import { Box2 } from 'util/box'
import { Buffer } from 'util/buffer'
import { ChangeTracker } from 'util/change_tracker'
import { CircleMap } from 'util/circle_map'
import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { RateLimiter } from 'util/rate_limiter'
import { Timer} from 'util/timer'
import { Vec, Vec2, Vec3 } from 'util/vector'

enum AnimationGroup {
	UNKNOWN,

	MOVEMENT,
}

enum Animation {
	IDLE = "Idle",
	WALK = "Walk",
	JUMP = "Jump",
}
 
enum Bone {
	ARM = "arm.R",
	ARMATURE = "Armature",
	BACK = "back",
	BEAK = "beak",
	EYE = "eye.R",
	FOREHEAD = "forehead",
	HEAD = "head",
	MESH = "mesh",
	NECK = "neck",
	SPINE = "spine",
}

enum Material {
	BASE = "base",
	EYE = "eye",
}

enum Emotion {
	UNKNOWN,
	NORMAL,
	MAD,
	SAD,
	DEAD,
}

enum SubProfile {
	UNKNOWN,
	HEAD,
}

export class Player extends EntityBase implements Entity, EquipEntity {
	// blockdudes3 = 18.0
	private static readonly _sideAcc = 0.5;
	private static readonly _jumpVel = 0.33;
	private static readonly _maxHorizontalVel = 0.25;
	private static readonly _maxVerticalVel = 0.6;
	private static readonly _maxFloatingVel = 0.1;
	private static readonly _minSpeed = 5e-4;

	private static readonly _turnMultiplier = 3.0;
	private static readonly _fallMultiplier = 1.5;
	private static readonly _lowSpeedMultiplier = 1.5;
	private static readonly _lowSpeedThreshold = 0.05;

	private static readonly _friction = 20;
	private static readonly _airResistance = 5;

	private static readonly _rotationOffset = -0.1;
	private static readonly _jumpGracePeriod = 160;

	private static readonly _armRecoveryTime = 500;
	private static readonly _crateCheckInterval = 250;

	private static readonly _defaultColor = "#ffffff";

	private static readonly _animations = new Map<AnimationGroup, Set<string>>([
		[AnimationGroup.MOVEMENT, new Set([Animation.IDLE, Animation.WALK, Animation.JUMP])],
	]);
	private static readonly _controllableBones = new Set<string>([
		Bone.ARM, Bone.ARMATURE, Bone.BACK, Bone.BEAK, Bone.EYE, Bone.FOREHEAD, Bone.HEAD, Bone.NECK,
	]);

	// TODO: package in struct, Pose, PlayerPose?
	private _armDir : Vec2;
	private _armRecoil : number;
	private _headDir : Vec2;
	private _boneOrigins : Map<Bone, BABYLON.Vector3>;
	private _eyeShifter : MaterialShifter;

	private _canJump : boolean;
	private _canJumpTimer : Timer;
	private _canDoubleJump : boolean;
	private _deadTracker : ChangeTracker<boolean>;
	private _groundedTracker : ChangeTracker<boolean>;

	private _nearestCrate : Optional<Crate>;
	private _crateRateLimiter : RateLimiter;

	private _association : Association;
	private _attributes : Attributes;
	private _entityTrackers : EntityTrackers;
	private _expression : Expression<Emotion>;
	private _model : Model;
	private _modifiers : Modifiers;
	private _profile : Profile;
	private _stats : Stats;
	private _headSubProfile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLAYER, entityOptions);

		this._armDir = Vec2.i();
		this._armRecoil = 0;
		this._headDir = Vec2.i();
		this._boneOrigins = new Map();
		this._eyeShifter = new MaterialShifter();

		this._canJump = false;
		this._canJumpTimer = this.newTimer({
			canInterrupt: true,
		});
		this._canDoubleJump = false;
		this._deadTracker = new ChangeTracker(() => {
			return this.dead();
		}, (dead : boolean) => {
			if (dead) {
				const x = this._profile.vel().x;
				const sign = x >= 0 ? -1 : 1;

				this._profile.resetInertia();
				this._profile.setAngularVelocity(sign * Math.max(0.3, Math.abs(x)));
				this._profile.setAcc({x: 0});
				this._profile.addVel({y: 0.7 * Player._jumpVel});
				this._expression.setOverride(Emotion.DEAD);
			} else {
				this._profile.setInertia(Infinity);
				this._profile.setAngularVelocity(0);
				this._expression.clearOverride();
			}
		});
		this._groundedTracker = new ChangeTracker(() => {
			return this.getAttribute(AttributeType.GROUNDED);
		}, (grounded : boolean) => {
			if (this._model.hasMesh()
				&& grounded
				&& !this.dead()) {
				for (let i of [-1, 1]) {
					const scale = 0.25 + 0.1 * Math.random();
					this.addEntity(EntityType.PARTICLE_SMOKE, {
						offline: true,
						ttl: 500,
						profileInit: {
							pos: this._profile.pos().clone().sub({ y: this._profile.scaledDim().y / 2 - 0.3 }),
							vel: { x: 0.05 * i * (1 + 0.5 * Math.random()) },
							acc: { x: -0.1 * i, y: 0.1 },
							scaling: { x: scale, y: scale },
						},
						modelInit: {
							transforms: {
								translate: { z: this._model.mesh().position.z + 0.3 },
							}
						}
					});
				}
			}
		});

		this._nearestCrate = new Optional();
		this._crateRateLimiter = new RateLimiter(Player._crateCheckInterval);

		this.addProp<boolean>({
			export: () => { return this._canDoubleJump; },
			import: (obj : boolean) => { this._canDoubleJump = obj; },
		});
		this.addProp<GameObjectState>({
			export: () => { return this.state(); },
			import: (obj : GameObjectState) => { this.setState(obj); },
		});

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.GROUNDED, false);
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._entityTrackers = this.addComponent<EntityTrackers>(new EntityTrackers());

		this._expression = this.addComponent<Expression<Emotion>>(new Expression({ defaultValue: Emotion.NORMAL }));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					density: BodyFactory.playerDensity,
					chamfer: {
						radius: 0.05,
					},
					friction: 0,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.PLAYER),
					plugin: {
						zIndex: DepthType.PLAYER,
					},
					render: {
						fillStyle: this.clientColorOr(Player._defaultColor),
					}
				});
			},
			init: entityOptions.profileInit,
		}));
		if (!this.clientIdMatches()) {
			this._profile.setRenderUnoccluded();
		}
		this._profile.setAngle(0);
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});

		this._profile.setLimitFn((profile : Profile) => {
			if (Math.abs(profile.vel().x) > Player._maxHorizontalVel) {
				profile.vel().x = Math.sign(profile.vel().x) * Player._maxHorizontalVel;
			}

			const maxVerticalVel = this.getAttribute(AttributeType.FLOATING) ? Player._maxFloatingVel : Player._maxVerticalVel;
			if (Math.abs(profile.vel().y) > maxVerticalVel) {
				profile.vel().y = Math.sign(profile.vel().y) * maxVerticalVel;
			}
		});

		this._headSubProfile = this._profile.registerSubComponent<Profile>(SubProfile.HEAD, new Profile({
			bodyFn: (head : Profile) => {
				return BodyFactory.rectangle(head.pos(), head.unscaledDim(), {
					isSensor: true,
					collisionFilter: BodyFactory.customCollisionFilter(CollisionCategory.PLAYER, [
						CollisionCategory.HIT_BOX,
						CollisionCategory.SOLID,
					]),
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
		this._headSubProfile.setRenderNever();
		this._headSubProfile.setAngle(0);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.BIRD, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.getChildMeshes().forEach((mesh : BABYLON.Mesh) => {
						if (!mesh.material || !(mesh.material instanceof BABYLON.PBRMaterial)) { return; }

						if (mesh.material.name === Material.BASE) {
							const texture = this.clientId() % 2 === 1 ? TextureType.BIRD_CHICKEN : TextureType.BIRD_BOOBY;

							(<BABYLON.Texture>mesh.material.albedoTexture).updateURL(TextureFactory.getURL(texture));
						} else if (mesh.material.name === Material.EYE) {
							const texture = this.clientId() % 2 === 1 ? TextureType.CHICKEN_EYE : TextureType.BOOBY_EYE;

							(<BABYLON.Texture>mesh.material.albedoTexture).updateURL(TextureFactory.getURL(texture));
							mesh.material.albedoTexture.hasAlpha = true;
							mesh.material.useAlphaFromAlbedoTexture = true;
							mesh.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
							mesh.material.needDepthPrePass = true;

							this._eyeShifter.setMaterial(mesh.material, Box2.fromBox({
								min: {x: 0, y: 0},
								max: {x: 4, y: 1},
							}));
							this._eyeShifter.registerOffset(Emotion.NORMAL, {x: 0, y: 0});
							this._eyeShifter.registerOffset(Emotion.MAD, {x: 1, y: 0});
							this._eyeShifter.registerOffset(Emotion.SAD, {x: 2, y: 0});
							this._eyeShifter.registerOffset(Emotion.DEAD, {x: 3, y: 0});
						}
					});

					result.animationGroups.forEach((animationGroup : BABYLON.AnimationGroup) => {
						const movementAnimations = Player._animations.get(AnimationGroup.MOVEMENT);
						if (movementAnimations.has(animationGroup.name)) {
							animationGroup.enableBlending = true;
							animationGroup.blendingSpeed = 0.25;
							model.registerAnimation(animationGroup, AnimationGroup.MOVEMENT);
						}
					})
					model.stopAllAnimations();

					result.skeletons[0].bones.forEach((bone : BABYLON.Bone) => {
						model.registerBone(bone);
					});

					Player._controllableBones.forEach((name : string) => {
						if (!model.hasBone(name)) {
							console.error("Error: missing bone %s for %s", name, this.name());
							return;
						}
						const bone = <Bone>name;
						this._boneOrigins.set(bone, model.getBone(bone).getTransformNode().position);
					})

					let armature = model.getBone(Bone.ARMATURE).getTransformNode();
					armature.rotation = new BABYLON.Vector3(0, Math.PI / 2 + Player._rotationOffset, 0);
					const dim = this._profile.unscaledDim();
					armature.position.y -= dim.y / 2;

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
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

		const [nameTag, hasNameTag] = this.addEntity<NameTag>(EntityType.NAME_TAG, {
			associationInit: {
				owner: this,
			},
			clientId: this.clientId(),
			offline: true,
		});
		if (hasNameTag) {
			nameTag.setDisplayName(this.displayName());
			nameTag.setPointerColor(this.clientColorOr(Player._defaultColor));
		}
	}

	displayName() : string { return game.tablet(this.clientId()).displayName(); }
	respawn(spawn : Vec2) : void {
		this.setAttribute(AttributeType.GROUNDED, false);
		this._canJump = false;
		this._canJumpTimer.reset();
		this._canDoubleJump = false;

		this._expression.reset();

		this._profile.setPos(spawn);
		this._profile.uprightStop();
		this._profile.setInertia(Infinity);
		this.updateLoadout();
	}
	stats() : Stats { return this._stats; }
	die() : void { this.takeDamage(this._stats.health(), this); }
	dead() : boolean { return this._stats.dead(); }

	equips() : CircleMap<number, Equip<Player>> { return this._entityTrackers.getEntities<Equip<Player>>(EntityType.EQUIP); }
	equip(equip : Equip<Player>) : void {
		this._model.onLoad((m : Model) => {
			let equipModel = equip.model();

			switch(equip.attachType()) {
			case AttachType.ARM:
				const arm = m.getBone(Bone.ARM);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(arm, m.mesh());
					em.mesh().rotation.x = 3 * Math.PI / 2;
					em.mesh().rotation.z = Math.PI;
				});
				break;
			case AttachType.ARMATURE:
				const armature = m.getBone(Bone.ARMATURE);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(armature, m.mesh());
				});
				break;
			case AttachType.BACK:
				const back = m.getBone(Bone.BACK);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(back, m.mesh());
				});
				break;
			case AttachType.BEAK:
				const beak = m.getBone(Bone.BEAK);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(beak, m.mesh());
					em.mesh().rotation.y = Math.PI;
				});
				break;
			case AttachType.EYE:
				const eye = m.getBone(Bone.EYE);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(eye, m.mesh());
				});
				break;
			case AttachType.FOREHEAD:
				const forehead = m.getBone(Bone.FOREHEAD);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(forehead, m.mesh());
				});
				break;
			case AttachType.HEAD:
				const head = m.getBone(Bone.HEAD);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(head, m.mesh());
				});
				break;
			case AttachType.ROOT:
				equipModel.onLoad((em : Model) => {
					em.root().parent = m.root();
				});
				break;
			default:
				console.error("Error: unhandled attach type", AttachType[equip.attachType()]);
			}
		});
	}
	createEquips(equipType : EntityType, altEquipType? : EntityType) : void {
		this._entityTrackers.clearEntityType(EntityType.EQUIP);
		const [equip, hasEquip] = this.addEntity<Equip<Player>>(equipType, {
			associationInit: {
				owner: this,
			},
			clientId: this.clientId(),
			levelVersion: game.level().version(),
		});
		if (hasEquip) {
			this._entityTrackers.trackEntity<Equip<Player>>(EntityType.EQUIP, equip);
		}

		if (altEquipType) {
			const [altEquip, hasAltEquip] = this.addEntity<Equip<Player>>(altEquipType, {
				associationInit: {
					owner: this,
				},
				clientId: this.clientId(),
				levelVersion: game.level().version(),
			});
			if (hasAltEquip) {
				this._entityTrackers.trackEntity<Equip<Player>>(EntityType.EQUIP, altEquip);
			}
		}
	}

	override cameraOffset() : Vec3 {
		let pos = super.cameraOffset();
		this.equips().execute((equip : Equip<Player>) => {
			pos.add(equip.cameraOffset());
		});
		this._entityTrackers.getEntities<Bubble>(EntityType.BUBBLE).executeFirst((bubble : Bubble) => {
			pos.add(bubble.cameraOffset());
		}, (bubble : Bubble) => {
			return true;
		});
		return pos;
	}

	override takeDamage(amount : number, from : Entity) : void {
		super.takeDamage(amount, from);

		this._expression.emote(Emotion.SAD, {
			max: 1.0,
			delta: Fns.clamp(0, amount / 100, 1),
			millis: 1500,
		});
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		// Out of bounds
		if (this._profile.pos().y < game.level().bounds().min.y) {
			this.die();
		}

		if (this.isSource() || this.clientIdMatches()) {
			this.setAttribute(AttributeType.GROUNDED, this._canJumpTimer.timeLeft() > Player._jumpGracePeriod / 2);
		}

		this._deadTracker.check();
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		// Gravity
		const falling = !this.getAttribute(AttributeType.GROUNDED) && this._profile.vel().y < 0;
		const gravity = falling ? Player._fallMultiplier * GameGlobals.gravity : GameGlobals.gravity;
		this._profile.setAcc({ y: gravity });

		if (!this.dead()) {
			let sideAcc = 0;
			if (this.key(KeyType.LEFT, KeyState.DOWN)) {
				sideAcc = -Player._sideAcc;
			} else if (this.key(KeyType.RIGHT, KeyState.DOWN)) {
				sideAcc = Player._sideAcc;
			}

			// Accel multipliers
			if (sideAcc !== 0) {
				const turning = Math.sign(this._profile.acc().x) === -Math.sign(this._profile.vel().x);
				const sideSpeed = Math.abs(this._profile.vel().x);

				if (turning) {
					sideAcc *= Player._turnMultiplier;
				} else if (sideSpeed < Player._lowSpeedThreshold) {
					sideAcc *= (1 + Player._lowSpeedThreshold - sideSpeed) * Player._lowSpeedMultiplier;
				}
			}
			this._profile.setAcc({ x: sideAcc });

			// Compute head and arm directions
			const dir = this.inputDir();
			this.recomputeDir(dir);
			this._headSubProfile.setAngle(this._headDir.angleRad());

			// Check for actions during grounded changes
			this._groundedTracker.check();

			// Jumping
			if (this._canJump && this._canJumpTimer.hasTimeLeft()) {
				if (this.key(KeyType.JUMP, KeyState.DOWN)) {
					this._profile.setVel({ y: Player._jumpVel });
					this._canJump = false;
				}
			} else if (this._canDoubleJump) {
				if (this.key(KeyType.JUMP, KeyState.PRESSED)) {
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
			if (this.getAttribute(AttributeType.GROUNDED)) {
				sideVel *= 1 / (1 + Player._friction * millis / 1000);
			} else {
				sideVel *= 1 / (1 + Player._airResistance * millis / 1000);
			}
			this._profile.setVel({x: sideVel });
		}

		if (this._model.hasMesh()) {
			// Cosmetic stuff
			if (this._armRecoil > 0) {
				this._armRecoil -= Math.abs(millis / Player._armRecoveryTime);
				if (this._armRecoil < 0) {
					this._armRecoil = 0;
				}
			}
		}
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (this._entityTrackers.hasEntityType(EntityType.BUBBLE)
			&& other.getAttribute(AttributeType.SOLID)
			&& other.type() !== EntityType.PLAYER) {
			this._entityTrackers.getEntities<Bubble>(EntityType.BUBBLE).execute((bubble : Bubble) => {
				bubble.pop();
			});
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		const millis = stepData.millis;

		const buffer = this._profile.collisionBuffer();
		if (buffer.hasRecords()) {
			const record = buffer.record(RecordType.MAX_NORMAL_Y);

			if (record.collision.normal.y > 0.8 && this._profile.overlap(record.entity.profile()).x > 0) {
				this._canJump = true;
				this._canDoubleJump = true;
				this._canJumpTimer.start(Player._jumpGracePeriod);
			}
		}

		// Check for nearby crates
		if (this._crateRateLimiter.check(millis)) {
			// Need to use render position for circular levels
			const pos = this._profile.pos();
			const width = this._profile.width();
			const height = this._profile.height();
			const bounds = MATTER.Bounds.create([
				{ x: pos.x - width / 2 - 1, y: pos.y - height / 2 - 1 },
				{ x: pos.x + width / 2 + 1, y: pos.y - height / 2 - 1 },
				{ x: pos.x + width / 2 + 1, y: pos.y + height / 2 + 1 },
				{ x: pos.x - width / 2 - 1, y: pos.y + height / 2 + 1 },
			]);
			const bodies = MATTER.Query.region(game.physics().world().bodies, bounds);

			let nearestCrate : Crate = null;
			let currentDistSq : number = null;
			for (let i = 0; i < bodies.length; ++i) {
				const [entity, ok] = game.physics().queryEntity(bodies[i]);
				if (!ok || entity.type() !== EntityType.CRATE) {
					continue;
				}
				const distSq = pos.distSq(entity.profile().pos());
				if (nearestCrate === null || distSq < currentDistSq) {
					nearestCrate = <Crate>entity;
					currentDistSq = distSq
				}
			}

			if (this._nearestCrate.has()) {
				this._nearestCrate.get().setCanOpen(false);
				this._nearestCrate.clear();
			}
			if (nearestCrate !== null) {
				nearestCrate.setCanOpen(true);
				if (this.isLakituTarget()) {
					nearestCrate.showTooltip();
				}
				this._nearestCrate.set(nearestCrate);
			}
		}

		// Open crates
		// TODO: put in update?
		if (this.isSource() && this.key(KeyType.INTERACT, KeyState.PRESSED) && this._nearestCrate.has()) {
			let crate = this._nearestCrate.get();
			this.createEquips(crate.equipType(), crate.altEquipType());
			crate.open();
			this._crateRateLimiter.reset();
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		// Perform any required actions when using equips
		this._entityTrackers.getEntities<Equip<Player>>(EntityType.EQUIP).execute((equip : Equip<Player>) => {
			const uses = equip.popUses();
			if (uses > 0) {
				switch(equip.attachType()) {
				case AttachType.ARM:
					this._armRecoil = equip.recoilType();

					// TODO: move emote value to equip
					this._expression.emote(Emotion.MAD, {
						max: 1.0,
						delta: uses / 3,
						millis: 1500,
					});
					break;
				}
			}
		});

		// Animation and expression
		if (!this._attributes.getAttribute(AttributeType.GROUNDED) || this.dead()) {
			this._model.playAnimation(Animation.JUMP);
		} else {
			if (Math.abs(this._profile.acc().x) < 0.01) {
				this._model.playAnimation(Animation.IDLE);
			} else {
				this._model.playAnimation(Animation.WALK, {
					speedRatio: 0.3 + Math.abs(this._profile.vel().x / Player._maxHorizontalVel),
				});
			}
		}
		this._eyeShifter.offset(this._expression.emotion());

		if (this.clientIdMatches() && !this.dead()) {
			this.recomputeDir(game.keys(this.clientId()).dir());
		}
		const headSign = this._headDir.x === 0 ? 1 : Math.sign(this._headDir.x);
		this._model.mesh().scaling.x = headSign * Math.abs(this._model.mesh().scaling.x);

		let neckAngle = this._headDir.angleRad();
		if (headSign > 0) {
			neckAngle *= -1;
		} else {
			neckAngle += Math.PI;
		}
		let neck = this._model.getBone(Bone.NECK).getTransformNode();
		neck.rotation = new BABYLON.Vector3(neckAngle, neck.rotation.y, neck.rotation.z);

		// Compute arm rotation
		let arm = this._model.getBone(Bone.ARM).getTransformNode();
		let armRotation = this._armDir.angleRad();
		if (headSign > 0) {
			armRotation -= Math.PI / 2;
		} else {
			armRotation = -armRotation + Math.PI / 2;
		}
		arm.rotation = new BABYLON.Vector3(armRotation, Math.PI, 0);

		// Compute arm position
		let recoil = new BABYLON.Vector3(0, -Math.cos(armRotation) * this._armRecoil, Math.sin(armRotation) * this._armRecoil);
		arm.position = this._boneOrigins.get(Bone.ARM).add(recoil);
	}

	override getCounts() : Map<CounterType, number> {
		let counts = super.getCounts();
		counts.set(CounterType.HEALTH, this._stats.health());

		this._entityTrackers.getEntities<Equip<Player>>(EntityType.EQUIP).execute((equip : Equip<Player>) => {
			equip.getCounts().forEach((count : number, type : CounterType) => {
				counts.set(type, count);
			});
		});
		return counts;
	}

	private updateLoadout() : void {
		if (!this.isSource()) {
			return;
		}

		this._model.onLoad(() => {
			if (!this._entityTrackers.hasEntityType(EntityType.BEAK)) {
				const beakType = this.clientId() % 2 === 1 ? EntityType.CHICKEN_BEAK : EntityType.BOOBY_BEAK;
				const [beak, hasBeak] = this.addEntity<Beak>(beakType, {
				associationInit: {
					owner: this,
				},
				clientId: this.clientId(),
			});
				if (hasBeak) {
					this._entityTrackers.trackEntity<Beak>(EntityType.BEAK, beak);
				}
			}

			if (!this._entityTrackers.hasEntityType(EntityType.HEADWEAR)) {
				const hairType = this.clientId() % 2 === 1 ? EntityType.CHICKEN_HAIR : EntityType.BOOBY_HAIR;
				const [headwear, hasHeadwear] = this.addEntity<Headwear>(hairType, {
				associationInit: {
					owner: this,
				},
				clientId: this.clientId(),
			});
				if (hasHeadwear) {
					this._entityTrackers.trackEntity<Headwear>(EntityType.HEADWEAR, headwear);
				}
			}

			const loadout = game.clientDialog(this.clientId()).message(DialogType.LOADOUT);

			this._modifiers.setModifier(ModifierType.PLAYER_TYPE, loadout.getPlayerType());

			this.createEquips(loadout.getEquipType(), loadout.getAltEquipType());

			this._entityTrackers.clearEntityType(EntityType.BUBBLE);
			const [bubble, hasBubble] = this.addEntity<Bubble>(EntityType.BUBBLE, {
				associationInit: {
					owner: this,
				},
				clientId: this.clientId(),
				levelVersion: game.level().version(),
			});
			if (hasBubble) {
				this._entityTrackers.trackEntity<Bubble>(EntityType.BUBBLE, bubble);
			}

			this._stats.reset();
			this._stats.processComponent<Modifiers>(this._modifiers);
			this._profile.processComponent<Stats>(this._stats);
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