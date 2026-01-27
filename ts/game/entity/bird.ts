import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { StepData } from 'game/game_object'
import { AssociationType, AttributeType, ComponentType, EmotionType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Buffs } from 'game/component/buffs'
import { EntityTrackers } from 'game/component/entity_trackers'
import { Expression } from 'game/component/expression'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Resources } from 'game/component/resources'
import { ChangeLog } from 'game/component/util/change_log'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType, BirdType, BoneType } from 'game/entity/api'
import { Player } from 'game/entity/bird/player'
import { Crate } from 'game/entity/interactable/crate'
import { Equip, AttachType, AutoUseType } from 'game/entity/equip'
import { Beak } from 'game/entity/equip/beak'
import { Bubble } from 'game/entity/equip/bubble'
import { Headwear } from 'game/entity/equip/headwear'
import { NameTag } from 'game/entity/equip/name_tag'
import { BuffType, CollisionCategory, ColorType, MaterialType, MeshType, StatType, TextureType } from 'game/factory/api'
import { DepthType, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { TextureFactory } from 'game/factory/texture_factory'
import { RecordType } from 'game/util/collision_buffer'
import { MaterialShifter } from 'game/util/material_shifter'
import { Transforms } from 'game/util/transforms'

import { settings } from 'settings'

import { ui } from 'ui'

import { Box2 } from 'util/box'
import { Buffer } from 'util/buffer'
import { CardinalDir } from 'util/cardinal'
import { ChangeTracker } from 'util/change_tracker'
import { CircleMap } from 'util/circle_map'
import { Fns, InterpType } from 'util/fns'
import { Optional } from 'util/optional'
import { RateLimiter } from 'util/rate_limiter'
import { SavedCounter } from 'util/saved_counter'
import { Timer} from 'util/timer'
import { Vec, Vec2 } from 'util/vector'

enum AnimationGroup {
	UNKNOWN,

	MOVEMENT,
}

enum Animation {
	IDLE = "Idle",
	IDLE_TUCK = "IdleTuck",
	WALK = "Walk",
	JUMP = "Jump",
}

enum Material {
	BASE = "base",
	EYE = "eye",
}

export abstract class Bird extends EntityBase implements EquipEntity {
	// blockdudes3 = 18.0
	protected static readonly _sideAcc = 0.5;
	protected static readonly _jumpVel = 0.33;
	protected static readonly _maxHorizontalVel = 0.5;
	protected static readonly _maxWalkingVel = 0.25;
	protected static readonly _maxVerticalVel = 0.6;
	protected static readonly _maxFloatingVel = 0.1;
	protected static readonly _minSpeed = 5e-4;

	protected static readonly _turnMultiplier = 3.0;
	protected static readonly _fallMultiplier = 1.5;
	protected static readonly _lowSpeedMultiplier = 1.5;
	protected static readonly _lowSpeedThreshold = 0.05;

	protected static readonly _friction = 20;
	protected static readonly _airResistance = 5;

	protected static readonly _rotationOffset = -0.1;
	protected static readonly _jumpGracePeriod = 160;

	protected static readonly _knockbackRecoveryTime = 250;
	protected static readonly _damageFlashTime = 160;
	protected static readonly _sweatInterval = 4000;
	protected static readonly _walkSmokeInterval = 150;

	protected static readonly _headDim = {x: 0.96, y: 1.06};
	protected static readonly _sweatDegs = [40, 50, 130, 140];

	protected static readonly _animations = new Map<AnimationGroup, Set<string>>([
		[AnimationGroup.MOVEMENT, new Set([Animation.IDLE, Animation.IDLE_TUCK, Animation.WALK, Animation.JUMP])],
	]);
	protected static readonly _controllableBones = new Set<string>([
		BoneType.ARM, BoneType.ARMATURE, BoneType.BACK, BoneType.BEAK, BoneType.EYE, BoneType.FOREHEAD, BoneType.HEAD, BoneType.NECK,
	]);

	protected static readonly _birdTextures = new Map<BirdType, TextureType>([
		[BirdType.BOOBY, TextureType.BIRD_BOOBY],
		[BirdType.CARDINAL, TextureType.BIRD_CARDINAL],
		[BirdType.CHICKEN, TextureType.BIRD_CHICKEN],
		[BirdType.DUCK, TextureType.BIRD_DUCK],
		[BirdType.EAGLE, TextureType.BIRD_EAGLE],
		[BirdType.FLAMINGO, TextureType.BIRD_FLAMINGO],
		[BirdType.GOOSE, TextureType.BIRD_GOOSE],
		[BirdType.PIGEON, TextureType.BIRD_PIGEON],
		[BirdType.RAVEN, TextureType.BIRD_RAVEN],
		[BirdType.ROBIN, TextureType.BIRD_ROBIN],
	]);
	protected static readonly _eyeTextures = new Map<BirdType, TextureType>([
		[BirdType.BOOBY, TextureType.BLACK_EYE],
		[BirdType.CARDINAL, TextureType.WHITE_EYE],
		[BirdType.CHICKEN, TextureType.BLACK_EYE],
		[BirdType.DUCK, TextureType.BLACK_EYE],
		[BirdType.EAGLE, TextureType.EAGLE_EYE],
		[BirdType.FLAMINGO, TextureType.BLACK_EYE],
		[BirdType.GOOSE, TextureType.MAD_EYE],
		[BirdType.PIGEON, TextureType.WHITE_EYE],
		[BirdType.RAVEN, TextureType.WHITE_EYE],
		[BirdType.ROBIN, TextureType.WHITE_EYE],
	]);

	protected static readonly _beakTypes = new Map<BirdType, EntityType>([
		[BirdType.BOOBY, EntityType.BOOBY_BEAK],
		[BirdType.CARDINAL, EntityType.CARDINAL_BEAK],
		[BirdType.CHICKEN, EntityType.CHICKEN_BEAK],
		[BirdType.DUCK, EntityType.DUCK_BEAK],
		[BirdType.EAGLE, EntityType.EAGLE_BEAK],
		[BirdType.FLAMINGO, EntityType.FLAMINGO_BEAK],
		[BirdType.GOOSE, EntityType.GOOSE_BEAK],
		[BirdType.PIGEON, EntityType.PIGEON_BEAK],
		[BirdType.RAVEN, EntityType.RAVEN_BEAK],
		[BirdType.ROBIN, EntityType.ROBIN_BEAK],
	]);
	protected static readonly _hairTypes = new Map<BirdType, EntityType>([
		[BirdType.BOOBY, EntityType.BOOBY_HAIR],
		[BirdType.CARDINAL, EntityType.CARDINAL_HAIR],
		[BirdType.CHICKEN, EntityType.CHICKEN_HAIR],
		[BirdType.FLAMINGO, EntityType.FLAMINGO_HAIR],
		[BirdType.PIGEON, EntityType.PIGEON_HAIR],
		[BirdType.RAVEN, EntityType.RAVEN_HAIR],
		[BirdType.ROBIN, EntityType.ROBIN_HAIR],
	]);

	// TODO: package in struct, Pose, PlayerPose?
	protected _armDir : Vec2;
	protected _armTransforms : Transforms;
	protected _baseMaterial : Optional<BABYLON.PBRMaterial>;
	protected _headDir : Vec2;
	protected _boneOrigins : Map<BoneType, BABYLON.Vector3>;
	protected _eyeShifter : MaterialShifter;

	protected _canJump : boolean;
	protected _canJumpTimer : Timer;
	protected _doubleJumps : number;
	protected _dead : boolean;
	protected _damageCounter : SavedCounter;
	protected _damageTimer : Timer;
	protected _equipType : EntityType;
	protected _altEquipType : EntityType;
	protected _equipEntity : Equip<Bird>;
	protected _altEquipEntity : Equip<Bird>;
	protected _deadTracker : ChangeTracker<boolean>;
	protected _groundedTracker : ChangeTracker<boolean>;
	protected _nameTag : NameTag;
	protected _sweatRateLimiter : RateLimiter;
	protected _walkSmokeRateLimiter : RateLimiter;

	protected _association : Association;
	protected _attributes : Attributes;
	protected _buffs : Buffs;
	protected _entityTrackers : EntityTrackers;
	protected _expression : Expression;
	protected _model : Model;
	protected _profile : Profile;
	protected _resources : Resources;
	protected _headSubProfile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.BIRD);

		this._armDir = Vec2.i();
		this._armTransforms = new Transforms();
		this._baseMaterial = new Optional();
		this._headDir = Vec2.i();
		this._boneOrigins = new Map();
		this._eyeShifter = new MaterialShifter();

		this._canJump = false;
		this._canJumpTimer = this.newTimer({
			canInterrupt: true,
		});
		this._doubleJumps = 0;
		this._dead = false;
		this._damageCounter = new SavedCounter(0);
		this._damageTimer = this.newTimer({
			canInterrupt: true,
		});
		this._equipType = EntityType.UNKNOWN;
		this._altEquipType = EntityType.UNKNOWN;
		this._equipEntity = null;
		this._altEquipEntity = null;
		this._deadTracker = new ChangeTracker(() => { return this.dead(); }, (dead : boolean) => { this.onDead(dead) });
		this._groundedTracker = new ChangeTracker(() => { return this.grounded(); }, (grounded : boolean) => { this.onGrounded(grounded); });
		this._nameTag = null;
		this._sweatRateLimiter = new RateLimiter(Bird._sweatInterval);
		this._walkSmokeRateLimiter = new RateLimiter(Bird._walkSmokeInterval);

		this.addProp<boolean>({
			export: () => { return this._dead; },
			import: (obj : boolean) => { this.onDead(obj); },
		})
		this.addProp<number>({
			has: () => { return this._damageCounter.count() > 0; },
			export: () => { return this._damageCounter.count(); },
			import: (obj : number) => {
				this._damageCounter.set(obj);
				this.onDamage(this._damageCounter.syncAndPop());
			},
		});

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.LIVING, true);
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._buffs = this.addComponent<Buffs>(new Buffs());

		this._entityTrackers = this.addComponent<EntityTrackers>(new EntityTrackers());

		this._expression = this.addComponent<Expression>(new Expression());

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					density: BodyFactory.playerDensity,
					friction: 0,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.PLAYER),
					plugin: {
						zIndex: DepthType.PLAYER,
					},
					render: {
						fillStyle: this.clientColor(),
					}
				});
			},
			init: {
				clampPos: true,
				gravity: true,
				ignoreTinyCollisions: true,
				...entityOptions.profileInit,
			},
		}));
		this._profile.setInertia(Infinity);
		this._profile.setAngle(0);
		this._profile.setVel({x: 0, y: 0});
		this._profile.setAcc({x: 0, y: 0});

		this._profile.setLimitFn((profile : Profile) => {
			let maxHorizontalVel = profile.knockbackMillis() > 0 ? Bird._maxHorizontalVel : Bird._maxWalkingVel;
			maxHorizontalVel *= this.getSpeedMultiplier();

			if (Math.abs(profile.vel().x) > maxHorizontalVel) {
				profile.vel().x = Math.sign(profile.vel().x) * maxHorizontalVel;
			}

			let maxVerticalVel = this.getAttribute(AttributeType.BUBBLED) ? Bird._maxFloatingVel : Bird._maxVerticalVel;
			if (this.getAttribute(AttributeType.UNDERWATER)) {
				maxVerticalVel *= this._profile.vel().y > 0 ? 0.7 : 0.3;
			}

			if (Math.abs(profile.vel().y) > maxVerticalVel) {
				profile.vel().y = Math.sign(profile.vel().y) * maxVerticalVel;
			}
		});

		this._headSubProfile = this._profile.addSubComponent<Profile>(new Profile({
			bodyFn: (head : Profile) => {
				return BodyFactory.rectangle(head.pos(), head.initDim(), {
					collisionFilter: BodyFactory.customCollisionFilter(CollisionCategory.PLAYER, [CollisionCategory.HIT_BOX]),
				});
			},
			init: {
				pos: {x: 0, y: 0},
				dim: Bird._headDim,
			},
			prePhysicsFn: (profile : Profile) => { profile.snapWithOffset(this._profile, { y: 0.22 }); },
		}));
		this._headSubProfile.setAngle(0);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.BIRD, (result : LoadResult) => {
					let mesh = result.mesh;
					mesh.getChildMeshes().forEach((mesh : BABYLON.Mesh) => {
						if (!mesh.material || !(mesh.material instanceof BABYLON.PBRMaterial)) { return; }

						if (mesh.material.name === Material.BASE) {
							this._baseMaterial.set(mesh.material);
							const texture = Bird._birdTextures.get(this.birdType());
							(<BABYLON.Texture>mesh.material.albedoTexture).updateURL(TextureFactory.getURL(texture));
						} else if (mesh.material.name === Material.EYE) {
							const texture = this.eyeTexture();

							(<BABYLON.Texture>mesh.material.albedoTexture).updateURL(TextureFactory.getURL(texture));
							mesh.material.albedoTexture.hasAlpha = true;
							mesh.material.useAlphaFromAlbedoTexture = true;
							mesh.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
							mesh.material.needDepthPrePass = true;

							this._eyeShifter.setMaterial(mesh.material, Box2.fromBox({
								min: {x: 0, y: 0},
								max: {x: 4, y: 1},
							}));
							this._eyeShifter.registerOffset(EmotionType.NORMAL, {x: 0, y: 0});
							this._eyeShifter.registerOffset(EmotionType.MAD, {x: 1, y: 0});
							this._eyeShifter.registerOffset(EmotionType.SAD, {x: 2, y: 0});
							this._eyeShifter.registerOffset(EmotionType.DEAD, {x: 3, y: 0});
						}
					});

					result.animationGroups.forEach((animationGroup : BABYLON.AnimationGroup) => {
						const movementAnimations = Bird._animations.get(AnimationGroup.MOVEMENT);
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

					Bird._controllableBones.forEach((name : string) => {
						if (!model.hasBone(name)) {
							console.error("Error: missing bone %s for %s", name, this.name());
							return;
						}
						const bone = <BoneType>name;
						this._boneOrigins.set(bone, model.getBone(bone).getTransformNode().position);
					})

					let armature = model.getBone(BoneType.ARMATURE).getTransformNode();
					armature.rotation = new BABYLON.Vector3(0, Math.PI / 2 + Bird._rotationOffset, 0);
					const dim = this._profile.initDim();
					armature.position.y -= dim.y / 2;

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.FOOTSTEP);

		this._resources = this.addComponent<Resources>(new Resources({
			stats: [StatType.HEALTH, StatType.SHIELD],
		}));
	}

	override initialize() : void {
		super.initialize();

		const [nameTag, hasNameTag] = this.addEntity<NameTag>(EntityType.NAME_TAG, {
			associationInit: {
				owner: this,
			},
			offline: true,
		});
		if (hasNameTag) {
			nameTag.setDisplayName(this.displayName());
			nameTag.forcePointerColor(this.clientColor());
			this._nameTag = nameTag;
		}

		if (!this.dead()) {
			this.upright();
		}
	}

	abstract displayName() : string;
	protected abstract birdType() : BirdType;
	protected abstract eyeTexture() : TextureType;
	protected abstract walkDir() : number;
	protected abstract jumping() : boolean;
	protected abstract doubleJumping() : boolean;
	protected abstract reorient() : void;
	protected abstract getEquipPair() : [EntityType, EntityType];

	override setTeam(team : number) : void {
		super.setTeam(team);

		if (this._nameTag !== null) {
			this._nameTag.forcePointerColor(this.clientColor());
		}
	}

	override dead() : boolean { return this._dead; }

	// TODO: if has shields, make some other sound?
	override impactSound() : SoundType { return SoundType.BIRD_THUD; }

	override takeDamage(amount : number, from? : Entity, hitEntity? : Entity) : void {
		this._entityTrackers.getEntities<Beak>(EntityType.BEAK).execute((beak : Beak) => {
			beak.takeDamage(amount, from, hitEntity);
		});
		if (this.isSource() && amount > 0) {
			this._damageCounter.add(amount);
			this.onDamage(amount);
		}
		super.takeDamage(amount, from, hitEntity);
	}

	floatRespawn(spawn : Vec2) : void {
		this.respawn(spawn);

		if (this.isSource()) {
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
		}
	}
	respawn(spawn : Vec2) : void {
		if (this.isSource() || this.clientIdMatches()) {
			this.setAttribute(AttributeType.GROUNDED, false);
		}
		this._canJump = false;
		this._canJumpTimer.reset();
		this._doubleJumps = 0;

		this._profile.setPos(spawn);
		this._profile.setScaleFactor(this.getStat(StatType.SCALING));

		this.fullHeal();
		this.getUp();
		this.updateLoadout();
		this._buffs.refresh();
	}
	getUp() : void {
		this._dead = false;
		this._expression.reset();

		this.upright();
		this._profile.setInertia(Infinity);
		this._profile.uprightStop();
	}
	upright() : void {
		this.model().rotation().z = 0;
		this._profile.upright();
	}
	grounded() : boolean { return this.getAttribute(AttributeType.GROUNDED); }

	lastDamager() : [Player, boolean] {
		const [log, hasLog] = this._resources.lastDamager();
		if (hasLog) {
			return log.owner<Player>();
		}
		return [null, false];
	}
	fullHeal() : void {
		this._resources.fullHeal();
		this.getUp();
	}
	die() : void {
		this.setAttribute(AttributeType.INVINCIBLE, false);
		this.addShield(-this.shield());

		if (!this._resources.dead()) {
			this.takeDamage(this._resources.health(), this);
		}

		this._dead = true;
	}

	headAngle() : number { return this._headSubProfile.angle(); }

	buffs() : Buffs { return this._buffs; }

	protected setEquipUse(type : AutoUseType) : void {
		if (this._equipEntity !== null) {
			this._equipEntity.setAutoUse(type);
		}
	}
	protected setEquipDir(vec : Vec) : void {
		if (this._equipEntity !== null) {
			this._equipEntity.setInputDir(vec);
		}
	}
	protected setAltEquipUse(type : AutoUseType) : void {
		if (this._altEquipEntity !== null) {
			this._altEquipEntity.setAutoUse(type);
		}
	}

	equipType() : EntityType { return this._equipType; }
	altEquipType() : EntityType { return this._altEquipType; }
	equips() : CircleMap<number, Equip<Bird>> { return this._entityTrackers.getEntities<Equip<Bird>>(EntityType.EQUIP); }
	equip(equip : Equip<Bird>) : void {
		this._model.onLoad((m : Model) => {
			let equipModel = equip.model();

			switch(equip.attachType()) {
			case AttachType.ARM:
				const arm = m.getBone(BoneType.ARM);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(arm, m.mesh());
					em.mesh().rotation.x = 3 * Math.PI / 2;
					em.mesh().rotation.z = Math.PI;
				});
				break;
			case AttachType.ARMATURE:
				const armature = m.getBone(BoneType.ARMATURE);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(armature, m.mesh());
				});
				break;
			case AttachType.BACK:
				const back = m.getBone(BoneType.BACK);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(back, m.mesh());
				});
				break;
			case AttachType.BEAK:
				const beak = m.getBone(BoneType.BEAK);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(beak, m.mesh());
					em.mesh().rotation.y = Math.PI;
				});
				break;
			case AttachType.EYE:
				const eye = m.getBone(BoneType.EYE);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(eye, m.mesh());
				});
				break;
			case AttachType.FOREHEAD:
			case AttachType.EARS:
				const forehead = m.getBone(BoneType.FOREHEAD);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(forehead, m.mesh());
				});
				break;
			case AttachType.HEAD:
				const head = m.getBone(BoneType.HEAD);
				equipModel.onLoad((em : Model) => {
					em.root().attachToBone(head, m.mesh());
				});
				break;
			case AttachType.ROOT:
				equipModel.onLoad((em : Model) => {
					em.root().parent = m.root();
				});
				break;
			case AttachType.NONE:
				break;
			default:
				console.error("Error: unhandled attach type", AttachType[equip.attachType()]);
				return;
			}

			if (equip.hasType(EntityType.WEAPON)) {
				this._equipType = equip.type();
				this._equipEntity = equip;
			} else if (!equip.hasType(EntityType.HEADWEAR) && !equip.hasType(EntityType.BEAK)) {
				// Kinda fragile
				this._altEquipType = equip.type();
				this._altEquipEntity = equip;
			}

			if (this._altEquipEntity !== null) {
				this._entityTrackers.getEntities<Headwear>(EntityType.HEADWEAR).execute((headwear : Headwear) => {
					headwear.model().setVisible(!headwear.shouldHide(this._altEquipEntity.attachType()));
				});				
			}
		});
	}
	clearEquips() : void { this._entityTrackers.clearEntityType(EntityType.EQUIP); }
	createEquips(equipType : EntityType, altEquipType? : EntityType) : void {
		this.clearEquips();

		const [equip, hasEquip] = this.addEntity<Equip<Bird>>(equipType, {
			associationInit: {
				owner: this,
			},
			levelVersion: game.level().version(),
		});
		if (hasEquip) {
			this._entityTrackers.trackEntity<Equip<Bird>>(EntityType.EQUIP, equip);
			this._equipType = equipType;
		}

		if (altEquipType) {
			const [altEquip, hasAltEquip] = this.addEntity<Equip<Bird>>(altEquipType, {
				associationInit: {
					owner: this,
				},
				levelVersion: game.level().version(),
			});
			if (hasAltEquip) {
				this._entityTrackers.trackEntity<Equip<Bird>>(EntityType.EQUIP, altEquip);
				this._altEquipType = altEquipType;
			}
		}
	}
	mergeArmTransforms(transforms : Transforms) : void {
		this._armTransforms.merge(transforms);
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);
		const millis = stepData.millis;

		if (this.isSource()) {
			// Check if we dead
			if (this._profile.pos().y < game.level().bounds().min.y) {
				this.die();
			} else if (this._resources.dead()) {
				this.die();
			}
			this._deadTracker.check();
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		let millis = stepData.millis;

		// Gravity
		const fastFall = !this.grounded() && this._profile.vel().y < 0 && !this.getAttribute(AttributeType.UNDERWATER);
		this._profile.setGravityFactor(fastFall ? Bird._fallMultiplier : 1);

		if (!this.dead()) {
			// HACK to fix elusive netcode race condition causing players to tilt
			this._profile.upright();

			const walkDir = this.walkDir();
			if (walkDir === 0) {
				this._profile.setAcc({ x: 0 });
			} else {
				let sideAcc = walkDir * Bird._sideAcc * this.getSpeedMultiplier();

				if (this._profile.knockbackMillis() <= 0) {
					const turning = Math.sign(this._profile.acc().x) === -Math.sign(this._profile.vel().x);
					const sideSpeed = Math.abs(this._profile.vel().x);

					if (turning) {
						sideAcc *= Bird._turnMultiplier;
					} else if (sideSpeed < Bird._lowSpeedThreshold) {
						sideAcc *= (1 + Bird._lowSpeedThreshold - sideSpeed) * Bird._lowSpeedMultiplier;
					}
				}
				this._profile.setAcc({ x: sideAcc });
			}

			// Compute head and arm directions
			this.reorient();
			this._headSubProfile.setAngle(this._headDir.angleRad());

			// Check for actions during grounded changes
			this._groundedTracker.check();

			// Jumping
			if (this.getAttribute(AttributeType.UNDERWATER)) {
				this._doubleJumps = this.getStat(StatType.DOUBLE_JUMPS);
			}
			if (this._canJump && this._canJumpTimer.hasTimeLeft()) {
				if (this.jumping()) {
					this._profile.jump(Math.max(this._profile.vel().y, this.getJumpVel()));
					this._canJump = false;
					this._canJumpTimer.reset();
				}
			} else if (this.doubleJumping()) {
				if (this._doubleJumps > 0 && this._profile.vel().y < this.getJumpVel()) {
					this._profile.jump(this.getJumpVel());

					if (!this.getAttribute(AttributeType.UNDERWATER)) {
						this._doubleJumps--;
					}
				}
			}
		}

		// Friction and air resistance
		if (Math.abs(this._profile.vel().x) < Bird._minSpeed
			|| this._profile.acc().x === 0 && Math.abs(this._profile.vel().x) < 10 * Bird._minSpeed) {
			this._profile.setVel({x: 0});
		} else if (this._profile.knockbackMillis() === 0
			&& (this._profile.acc().x === 0 || Math.sign(this._profile.acc().x) !== Math.sign(this._profile.vel().x))) {
			let sideVel = this._profile.vel().x;
			if (this.grounded()) {
				sideVel *= 1 / (1 + Bird._friction * millis / 1000);
			} else {
				sideVel *= 1 / (1 + Bird._airResistance * millis / 1000);
			}
			this._profile.setVel({x: sideVel });
		}
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (other.getAttribute(AttributeType.SOLID)) {
			if (this._entityTrackers.hasEntityType(EntityType.BUBBLE)) {
				this._entityTrackers.getEntities<Bubble>(EntityType.BUBBLE).execute((bubble : Bubble) => {
					bubble.lightPop();
				});
			}

			if (collision.normal.y > 0.8 && this._profile.overlap(other.profile()).x > 0.1) {
				if (!this._canJump && this._profile.vel().y < -0.1) {
					const volume = Fns.interp(InterpType.SQUARE, Fns.normalizeRange(-0.1, this._profile.vel().y, -Bird._maxVerticalVel));
					this.soundPlayer().playFromSelf(SoundType.FOOTSTEP, {
						volume: settings.soundVolume() * volume,
					});
				}

				this._canJump = true;
				this._doubleJumps = this.getStat(StatType.DOUBLE_JUMPS);
				this._canJumpTimer.start(Bird._jumpGracePeriod);
			}
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		const millis = stepData.millis;

		if (this.isSource() || this.clientIdMatches()) {
			this.setAttribute(AttributeType.GROUNDED, this._canJumpTimer.millisLeft() > 0);
		}

		// Sweat
		// TODO: move this and other particles to ParticleFactory
		const healthPercent = this.healthPercent();
		if (!this.dead() && healthPercent <= 0.5 && this._sweatRateLimiter.checkPercent(millis, Math.max(0.2, healthPercent))) {
			const weight = 1 - healthPercent;

			const dim = this._profile.dim();
			const headAngle = this._headSubProfile.angleDeg();
			const forward = Vec2.fromVec({ x: 1.3, y: 0 }).rotateDeg(headAngle);
			for (let i = 0; i < 4; ++i) {
				const sign = forward.x < 0 ? -1 : 1;
				const dir = forward.clone().rotateDeg(sign * Bird._sweatDegs[i]);
				const pos = dir.clone().add(this._profile.pos());

				this.addEntity(EntityType.SWEAT_PARTICLE, {
					offline: true,
					ttl: Fns.lerpRange(200, weight, 350),
					profileInit: {
						pos: pos,
						vel: {
							x: Fns.lerpRange(0.03, weight, 0.12) * dir.x,
							y: Fns.lerpRange(0.03, weight, 0.12) * dir.y,
						},
						scaling: { x: Fns.lerpRange(0.15, weight, 0.6), y: Fns.lerpRange(0.15, weight, 0.6) },
					},
					modelInit: {
						transforms: {
							translate: { z: this._model.mesh().position.z },
						},
						materialType: MaterialType.SWEAT,
					}
				});	
			}
		}
		if (healthPercent <= 0.2) {
			this.emote(EmotionType.SAD, 0.3);
		}

		// Animation
		if (this._model.hasMesh()) {
			if (!this.grounded() || this.dead()) {
				this._model.playAnimation(Animation.JUMP);
			} else if (Math.abs(this._profile.acc().x) > 1e-2 || Math.abs(this._profile.vel().x) > 1e-2) {
				this._model.playAnimation(Animation.WALK, {
					speedRatio: 0.3 + 1.2 * Math.abs(this._profile.vel().x / Bird._maxWalkingVel),
				});

				if (Math.abs(this._profile.vel().x) > 0.1 && this._walkSmokeRateLimiter.check(millis)) {
					const scale = 0.3 + 0.2 * Math.random();

					const speedWeight = Fns.randomRange(0.5, 1);
					this.addEntity(EntityType.SMOKE_PARTICLE, {
						offline: true,
						ttl: 500,
						profileInit: {
							pos: this._profile.getRelativePos(CardinalDir.BOTTOM, { x: scale, y: scale }),
							vel: { x: -0.05 * Math.sign(this._profile.vel().x) * speedWeight, y: 0 },
							acc: { x: 0.05 * Math.sign(this._profile.vel().x) * speedWeight, y: 0.1 * speedWeight },
							scaling: { x: scale, y: scale },
						},
						modelInit: {
							transforms: {
								translate: { z: this._model.mesh().position.z + 0.3 },
							}
						}
					});
				}
			} else {
				this._model.playAnimation(this.birdType() === BirdType.FLAMINGO ? Animation.IDLE_TUCK : Animation.IDLE);
				this._walkSmokeRateLimiter.reset();
			}
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		// Expression
		this._eyeShifter.offset(this._expression.emotion());

		if (!this.dead()) {
			if (this.clientIdMatches()) {
				this.reorient();
			}
			const headSign = this._headDir.x === 0 ? 1 : Math.sign(this._headDir.x);
			this._model.mesh().scaling.x = headSign * Math.abs(this._model.mesh().scaling.x);

			let neckAngle = this._headDir.angleRad();
			if (headSign > 0) {
				neckAngle *= -1;
			} else {
				neckAngle += Math.PI;
			}
			let neck = this._model.getBone(BoneType.NECK).getTransformNode();
			neck.rotation = new BABYLON.Vector3(neckAngle, neck.rotation.y, neck.rotation.z);

			// Compute arm rotation
			let arm = this._model.getBone(BoneType.ARM).getTransformNode();
			let armRotation = headSign * (this._armDir.angleRad() - Math.PI / 2);
			const recoilRotation = this._armTransforms.rotation();
			arm.rotation = new BABYLON.Vector3(armRotation + recoilRotation.z, Math.PI, -recoilRotation.y);

			// Compute arm position
			const armCos = Math.cos(armRotation);
			const armSin = Math.sin(armRotation);
			arm.position = this._boneOrigins.get(BoneType.ARM).add(new BABYLON.Vector3(
				0,
				-armCos * this._armTransforms.translation().x - armSin * this._armTransforms.translation().y,
				armSin * this._armTransforms.translation().x - armCos * this._armTransforms.translation().y,
			));
		}

		if (this._damageTimer.hasTimeLeft()) {
			const weight = 1 - this._damageTimer.percentElapsed();
			this.flashWhite(weight);
		}

		if (this._nameTag !== null) {
			this._nameTag.setBarWidth(this.healthPercent());
		}
	}

	protected setDir(dir : Vec2) : void {
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

	protected damageToTime(dmg : number) : number {
		if (dmg <= 0) {
			return 0;
		}
		return Fns.clamp(1, 0.5 * Math.ceil(Math.min(80, dmg) / 10), 2) * Bird._damageFlashTime; 
	}
	protected onDamage(dmg : number) : void {
		if (dmg <= 0) {
			return;
		}

		const time = this.damageToTime(dmg);
		if (!this._damageTimer.hasTimeLeft() || time > this._damageTimer.millisLeft()) {
			this._damageTimer.timeout(time, () => {
				this.flashWhite(0);
			});
		}
	}
	protected flashWhite(percent : number) : void {
		if (this._baseMaterial.has()) {
			this._baseMaterial.get().emissiveColor = new BABYLON.Color3(percent, percent, percent);
		}
	}

	protected updateLoadout() : void {
		if (!this.isSource()) {
			return;
		}

		this._model.onLoad(() => {
			if (!this._entityTrackers.hasEntityType(EntityType.BEAK)) {
				const beakType = Bird._beakTypes.get(this.birdType());
				const [beak, hasBeak] = this.addEntity<Beak>(beakType, {
					associationInit: {
						owner: this,
					},
				});
				if (hasBeak) {
					this._entityTrackers.trackEntity<Beak>(EntityType.BEAK, beak);
				}
			}

			if (!this._entityTrackers.hasEntityType(EntityType.HEADWEAR) && Bird._hairTypes.has(this.birdType())) {
				const hairType = Bird._hairTypes.get(this.birdType());
				const [headwear, hasHeadwear] = this.addEntity<Headwear>(hairType, {
					associationInit: {
						owner: this,
					},
				});
				if (hasHeadwear) {
					this._entityTrackers.trackEntity<Headwear>(EntityType.HEADWEAR, headwear);
				}
			}

			const [equipType, altEquipType] = this.getEquipPair();
			this.createEquips(equipType, altEquipType);

			this._resources.reset();
		});
	}

	protected onGrounded(grounded : boolean) : void {
		if (this._model.hasMesh()
			&& grounded
			&& !this.dead()) {
			for (let i of [-1, 1]) {
				const scale = 0.25 + 0.1 * Math.random();
				this.addEntity(EntityType.SMOKE_PARTICLE, {
					offline: true,
					ttl: 500,
					profileInit: {
						pos: this._profile.pos().clone().sub({ y: this._profile.dim().y / 2 - 0.3 }),
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
	}
	protected onDead(dead : boolean) : void {
		this._dead = dead;

		if (dead) {
			const x = this._profile.vel().x;
			const sign = x >= 0 ? -1 : 1;

			this._profile.resetInertia();
			this._profile.setAngularVelocity(sign * Math.max(0.3, Math.abs(x)));
			this._profile.setAcc({x: 0});
			this._profile.addVel({y: 0.7 * this.getJumpVel()});
			this.emote(EmotionType.DEAD);
		} else {
			this.getUp();
		}
	}

	protected getJumpVel() : number {
		const scaling = this.getStat(StatType.SCALING);
		if (scaling <= 1) {
			return Bird._jumpVel;
		}
		return (0.3 * scaling + 0.7) * Bird._jumpVel;
	}
	protected getSpeedMultiplier() : number {
		let mult = 1 + this.getStat(StatType.SPEED_BOOST);
		if (this.getAttribute(AttributeType.BUBBLED)) {
			mult += 0.2;
		}
		if (!this.grounded()) {
			mult += this.getStat(StatType.AIR_SPEED_BOOST) * (1 + this.getStat(StatType.DOUBLE_JUMPS) - this._doubleJumps);
		}

		mult *= 1 - this.getStat(StatType.SPEED_DEBUFF);
		if (this.getAttribute(AttributeType.UNDERWATER)) {
			mult *= 0.6;
		}
		return Math.max(0.1, mult);
	}
}