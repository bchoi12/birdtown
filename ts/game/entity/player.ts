import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameState, GameObjectState } from 'game/api'
import { StepData } from 'game/game_object'
import { AssociationType, AttributeType, ComponentType, EmotionType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { EntityTrackers } from 'game/component/entity_trackers'
import { Expression } from 'game/component/expression'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Resources } from 'game/component/resources'
import { ChangeLog } from 'game/component/util/change_log'
import { Entity, EntityBase, EntityOptions, EquipEntity, InteractEntity } from 'game/entity'
import { EntityType, BirdType, BoneType } from 'game/entity/api'
import { Crate } from 'game/entity/interactable/crate'
import { Equip, AttachType } from 'game/entity/equip'
import { Beak } from 'game/entity/equip/beak'
import { Bubble } from 'game/entity/equip/bubble'
import { Headwear } from 'game/entity/equip/headwear'
import { NameTag } from 'game/entity/equip/name_tag'
import { TextParticle } from 'game/entity/particle/text_particle'
import { CollisionCategory, ColorType, MaterialType, MeshType, StatType, TextureType } from 'game/factory/api'
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
import { HudType, HudOptions, KeyType, KeyState, InfoType, TooltipType } from 'ui/api'

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

enum Material {
	BASE = "base",
	EYE = "eye",
}

export class Player extends EntityBase implements EquipEntity, InteractEntity {
	// blockdudes3 = 18.0
	private static readonly _sideAcc = 0.5;
	private static readonly _jumpVel = 0.33;
	private static readonly _maxHorizontalVel = 0.5;
	private static readonly _maxWalkingVel = 0.25;
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

	private static readonly _knockbackRecoveryTime = 250;
	private static readonly _interactCheckInterval = 125;
	private static readonly _heartInterval = 1000;
	private static readonly _damageFlashTime = 160;
	private static readonly _reviveTime = 5000;
	private static readonly _sweatInterval = 4000;
	private static readonly _walkSmokeInterval = 300;

	private static readonly _defaultColor = "#ffffff";
	private static readonly _headDim = {x: 0.96, y: 1.06};
	private static readonly _sweatDegs = [40, 50, 130, 140];

	private static readonly _animations = new Map<AnimationGroup, Set<string>>([
		[AnimationGroup.MOVEMENT, new Set([Animation.IDLE, Animation.WALK, Animation.JUMP])],
	]);
	private static readonly _controllableBones = new Set<string>([
		BoneType.ARM, BoneType.ARMATURE, BoneType.BACK, BoneType.BEAK, BoneType.EYE, BoneType.FOREHEAD, BoneType.HEAD, BoneType.NECK,
	]);

	private static readonly _birdTextures = new Map<BirdType, TextureType>([
		[BirdType.BOOBY, TextureType.BIRD_BOOBY],
		[BirdType.CHICKEN, TextureType.BIRD_CHICKEN],
		[BirdType.DUCK, TextureType.BIRD_DUCK],
		[BirdType.EAGLE, TextureType.BIRD_EAGLE],
		[BirdType.ROBIN, TextureType.BIRD_ROBIN],
	]);
	private static readonly _eyeTextures = new Map<BirdType, TextureType>([
		[BirdType.BOOBY, TextureType.BLACK_EYE],
		[BirdType.CHICKEN, TextureType.BLACK_EYE],
		[BirdType.DUCK, TextureType.BLACK_EYE],
		[BirdType.EAGLE, TextureType.EAGLE_EYE],
		[BirdType.ROBIN, TextureType.WHITE_EYE],
	]);

	private static readonly _beakTypes = new Map<BirdType, EntityType>([
		[BirdType.BOOBY, EntityType.BOOBY_BEAK],
		[BirdType.CHICKEN, EntityType.CHICKEN_BEAK],
		[BirdType.DUCK, EntityType.DUCK_BEAK],
		[BirdType.EAGLE, EntityType.EAGLE_BEAK],
		[BirdType.ROBIN, EntityType.ROBIN_BEAK],
	]);
	private static readonly _hairTypes = new Map<BirdType, EntityType>([
		[BirdType.BOOBY, EntityType.BOOBY_HAIR],
		[BirdType.CHICKEN, EntityType.CHICKEN_HAIR],
		[BirdType.ROBIN, EntityType.ROBIN_HAIR],
	]);

	// TODO: package in struct, Pose, PlayerPose?
	private _armDir : Vec2;
	private _armTransforms : Transforms;
	private _baseMaterial : Optional<BABYLON.PBRMaterial>;
	private _headDir : Vec2;
	private _boneOrigins : Map<BoneType, BABYLON.Vector3>;
	private _eyeShifter : MaterialShifter;

	private _canJump : boolean;
	private _canJumpTimer : Timer;
	private _canDoubleJump : boolean;
	private _dead : boolean;
	private _damageCounter : SavedCounter;
	private _damageTimer : Timer;
	private _equipType : EntityType;
	private _altEquipType : EntityType;
	private _deadTracker : ChangeTracker<boolean>;
	private _groundedTracker : ChangeTracker<boolean>;
	private _heartRateLimiter : RateLimiter;
	private _nameTag : NameTag;
	private _reviverId : number;
	private _sweatRateLimiter : RateLimiter;
	private _walkSmokeRateLimiter : RateLimiter;
	private _nearestInteractable : Optional<InteractEntity>;
	private _interactRateLimiter : RateLimiter;

	private _association : Association;
	private _attributes : Attributes;
	private _entityTrackers : EntityTrackers;
	private _expression : Expression;
	private _model : Model;
	private _profile : Profile;
	private _resources : Resources;
	private _headSubProfile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLAYER, entityOptions);

		this.allTypes().add(EntityType.INTERACTABLE);

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
		this._canDoubleJump = false;
		this._dead = false;
		this._damageCounter = new SavedCounter(0);
		this._damageTimer = this.newTimer({
			canInterrupt: true,
		});
		this._equipType = EntityType.UNKNOWN;
		this._altEquipType = EntityType.UNKNOWN;
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
				this.emote(EmotionType.DEAD);
			} else {
				this.getUp();
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
		});
		this._heartRateLimiter = new RateLimiter(Player._heartInterval);
		this._nameTag = null;
		this._reviverId = 0;
		this._sweatRateLimiter = new RateLimiter(Player._sweatInterval);
		this._walkSmokeRateLimiter = new RateLimiter(Player._walkSmokeInterval);
		this._nearestInteractable = new Optional();
		this._interactRateLimiter = new RateLimiter(Player._interactCheckInterval);

		this.addProp<boolean>({
			export: () => { return this._canDoubleJump; },
			import: (obj : boolean) => { this._canDoubleJump = obj; },
		});
		this.addProp<boolean>({
			export: () => { return this._dead; },
			import: (obj : boolean) => { this._dead = obj; },
		})
		this.addProp<EntityType>({
			export: () => { return this._equipType; },
			import: (obj : EntityType) => { this._equipType = obj; },
		});
		this.addProp<EntityType>({
			export: () => { return this._altEquipType; },
			import: (obj : EntityType) => { this._altEquipType = obj; },
		});
		this.addProp<GameObjectState>({
			export: () => { return this.state(); },
			import: (obj : GameObjectState) => { this.setState(obj); },
		});
		this.addProp<number>({
			export: () => { return this._reviverId; },
			import: (obj : number) => { this.importReviverId(obj); },
		});
		this.addProp<number>({
			has: () => { return this._damageCounter.count() > 0; },
			export: () => { return this._damageCounter.count(); },
			import: (obj : number) => {
				this._damageCounter.set(obj);
				this.damageEffect(this._damageCounter.save());
			},
		});

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);

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
						fillStyle: this.clientColorOr(Player._defaultColor),
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
			let maxHorizontalVel = profile.knockbackMillis() > 0 ? Player._maxHorizontalVel : Player._maxWalkingVel;
			if (this.getAttribute(AttributeType.LEVITATING)) {
				maxHorizontalVel *= 1.5;
			} else if (this.getAttribute(AttributeType.FLOATING)) {
				maxHorizontalVel *= 1.2;
			}
			if (this.getAttribute(AttributeType.UNDERWATER)) {
				maxHorizontalVel *= 0.6;
			}

			if (Math.abs(profile.vel().x) > maxHorizontalVel) {
				profile.vel().x = Math.sign(profile.vel().x) * maxHorizontalVel;
			}

			let maxVerticalVel = this.getAttribute(AttributeType.FLOATING) ? Player._maxFloatingVel : Player._maxVerticalVel;
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
				dim: Player._headDim,
			},
			prePhysicsFn: (profile : Profile) => { profile.snapWithOffset(this._profile, { y: 0.22 }); },
		}));
		this._headSubProfile.setVisible(false);
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
							const texture = Player._birdTextures.get(this.birdType());
							(<BABYLON.Texture>mesh.material.albedoTexture).updateURL(TextureFactory.getURL(texture));
						} else if (mesh.material.name === Material.EYE) {
							const texture = Player._eyeTextures.get(this.birdType());

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
						const bone = <BoneType>name;
						this._boneOrigins.set(bone, model.getBone(bone).getTransformNode().position);
					})

					let armature = model.getBone(BoneType.ARMATURE).getTransformNode();
					armature.rotation = new BABYLON.Vector3(0, Math.PI / 2 + Player._rotationOffset, 0);
					const dim = this._profile.initDim();
					armature.position.y -= dim.y / 2;

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.FOOTSTEP);

		this._resources = this.addComponent<Resources>(new Resources({
			stats: [StatType.HEALTH],
		}));
	}

	override ready() : boolean {
		return super.ready() && this.hasClientId() && game.tablets().hasTablet(this.clientId()) && game.tablet(this.clientId()).isSetup();
	}

	override initialize() : void {
		super.initialize();

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
			nameTag.forcePointerColor(this.clientColorOr(Player._defaultColor));
			this._nameTag = nameTag;
		}

		if (!this.dead()) {
			this.upright();
		}
	}

	displayName() : string { return game.tablet(this.clientId()).displayName(); }
	override setTeam(team : number) : void {
		super.setTeam(team);

		if (this._nameTag !== null && game.tablets().hasTablet(this.clientId())) {
			this._nameTag.forcePointerColor(game.tablet(this.clientId()).color());
		}
	}
	revive() : void {
		this.setAttribute(AttributeType.GROUNDED, true);
		this._resources.setHealthPercent(0.5);
		this.getUp();

		const [bubble, hasBubble] = this.addEntity<Bubble>(EntityType.BUBBLE, {
			associationInit: {
				owner: this,
			},
			clientId: this.clientId(),
			levelVersion: game.level().version(),
		});
		if (hasBubble) {
			bubble.hardPop();
		}
	}
	private cancelRevive() : void {
		this.setAttribute(AttributeType.REVIVING, false);

		const [reviver, hasReviver] = game.entities().getEntity(this._reviverId);
		if (hasReviver && reviver.clientIdMatches()) {
			ui.hideTooltip(TooltipType.REVIVING);
		}

		this._reviverId = 0;
		if (this.clientIdMatches()) {
			ui.hideTooltip(TooltipType.BEING_REVIVED);
		}
	}
	private importReviverId(id : number) : void {
		if (this._reviverId === id) {
			return;
		}

		const [reviver, hasReviver] = game.entities().getEntity(this._reviverId);
		if (hasReviver && reviver.clientIdMatches()) {
			ui.hideTooltip(TooltipType.REVIVING);
		}

		this._reviverId = id;
	}
	respawn(spawn : Vec2) : void {
		if (this.isSource() || this.clientIdMatches()) {
			this.setAttribute(AttributeType.GROUNDED, false);

			if (game.playerStates().hasPlayerState(this.clientId())) {
				this.setAttribute(AttributeType.VIP, game.playerState(this.clientId()).isVIP())
			}
		}
		this._canJump = false;
		this._canJumpTimer.reset();
		this._canDoubleJump = false;
		this._profile.setPos(spawn);
		this.fullHeal();

		this.getUp();
		this.updateLoadout();
	}
	getUp() : void {
		this.cancelRevive();
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
	lastDamager(millis : number) : [ChangeLog, boolean] { return this._resources.lastDamager(millis); }
	fullHeal() : void {
		this._resources.fullHeal();
		this.getUp();
	}
	die() : void {
		this.setAttribute(AttributeType.INVINCIBLE, false);
		this.takeDamage(this._resources.health(), this);
	}
	override dead() : boolean { return this._dead; }

	birdType() : BirdType { return game.tablet(this.clientId()).birdType(); }
	headAngle() : number { return this._headSubProfile.angle(); }
	equipType() : EntityType { return this._equipType; }
	altEquipType() : EntityType { return this._altEquipType; }
	equips() : CircleMap<number, Equip<Player>> { return this._entityTrackers.getEntities<Equip<Player>>(EntityType.EQUIP); }
	equip(equip : Equip<Player>) : void {
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

			if (equip.allTypes().has(EntityType.WEAPON)) {
				this._equipType = equip.type();
			} else if (!equip.allTypes().has(EntityType.HEADWEAR) && !equip.allTypes().has(EntityType.BEAK)) {
				// Kinda fragile
				this._altEquipType = equip.type();
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
			this._equipType = equipType;
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
				this._altEquipType = altEquipType;
			}
		}
	}
	mergeArmTransforms(transforms : Transforms) : void {
		this._armTransforms.merge(transforms);
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

	override impactSound() : SoundType { return SoundType.PLAYER_THUD; }

	override takeDamage(amount : number, from : Entity) : void {
		this._entityTrackers.getEntities<Beak>(EntityType.BEAK).execute((beak : Beak) => {
			beak.takeDamage(amount, from);
		});
		if (this.isSource() && amount > 0) {
			this._damageCounter.add(amount);
			this.damageEffect(amount);
		}

		let actualDamage = amount;
		if (amount > 0 && game.controller().gameState() === GameState.FREE && from.id() !== this.id()) {
			actualDamage = 0;
		}
		super.takeDamage(actualDamage, from);
	}
	private damageEffect(dmg : number) : void {
		if (dmg <= 0) {
			return;
		}

		const time = Fns.clamp(1, 0.5 * Math.ceil(dmg / 10), 2) * Player._damageFlashTime; 
		if (!this._damageTimer.hasTimeLeft() || time > this._damageTimer.millisLeft()) {
			this._damageTimer.start(time, () => {
				this.setDamageEffect(0);
			});
		}

		if (this.isLakituTarget()) {
			game.lakitu().shake(time);
			ui.flashScreen(ColorFactory.toString(ColorType.BLACK), 3 * time);
		}
	}
	private setDamageEffect(percent : number) : void {
		if (this._baseMaterial.has()) {
			this._baseMaterial.get().emissiveColor = new BABYLON.Color3(percent, percent, percent);
		}
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);
		const millis = stepData.millis;

		if (this.isSource()) {
			// Out of bounds
			if (this._profile.pos().y < game.level().bounds().min.y) {
				this.die();
			}

			if (this._resources.dead()) {
				this._dead = true;
			}
		}

		this._deadTracker.check();
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		let millis = stepData.millis;

		if (this._damageTimer.hasTimeLeft() && this._damageTimer.millisElapsed() < 30) {	
			millis *= 0.5;
		}

		// Gravity
		const fastFall = !this.getAttribute(AttributeType.GROUNDED) && this._profile.vel().y < 0 && !this.getAttribute(AttributeType.UNDERWATER);
		let gravityFactor = fastFall ? Player._fallMultiplier : 1;
		this._profile.setGravityFactor(gravityFactor);

		if (!this.dead()) {
			let sideAcc = 0;
			if (this.key(KeyType.LEFT, KeyState.DOWN)) {
				sideAcc = -Player._sideAcc;
			} else if (this.key(KeyType.RIGHT, KeyState.DOWN)) {
				sideAcc = Player._sideAcc;
			}

			// Accel multipliers
			if (sideAcc !== 0 && this._profile.knockbackMillis() === 0) {
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
			this.recomputeDir(this.inputDir());
			this._headSubProfile.setAngle(this._headDir.angleRad());

			// Check for actions during grounded changes
			this._groundedTracker.check();

			// Jumping
			if (this.getAttribute(AttributeType.UNDERWATER)) {
				this._canDoubleJump = true;
			}
			if (this._canJump && this._canJumpTimer.hasTimeLeft()) {
				if (this.key(KeyType.JUMP, KeyState.DOWN)) {
					this._profile.jump(Math.max(this._profile.vel().y, Player._jumpVel));
					this._canJump = false;
					this._canJumpTimer.reset();
				}
			} else if (this._canDoubleJump) {
				if (this.key(KeyType.JUMP, KeyState.PRESSED) && this._profile.vel().y < Player._jumpVel) {
					this._profile.jump(Player._jumpVel);

					if (!this.getAttribute(AttributeType.UNDERWATER)) {
						this._canDoubleJump = false;
					}
				}
			}

			if (this.getAttribute(AttributeType.FLOATING) && this._entityTrackers.hasEntityType(EntityType.BUBBLE)) {
				if (this.key(KeyType.JUMP, KeyState.PRESSED)) {
					this._entityTrackers.getEntities<Bubble>(EntityType.BUBBLE).execute((bubble : Bubble) => {
						bubble.pop();
					});
				} else {
					if (this.isLakituTarget() && this.clientIdMatches() && game.controller().gameState() === GameState.GAME) {
						ui.showTooltip(TooltipType.BUBBLE, {});
					}
				}
			} else if (this.isLakituTarget() && this.clientIdMatches()) {
				ui.hideTooltip(TooltipType.BUBBLE);
			}
		} else {
			if (this.getAttribute(AttributeType.REVIVING)) {
				this.heal(100 * millis / Player._reviveTime);
			}
		}

		// Friction and air resistance
		if (Math.abs(this._profile.vel().x) < Player._minSpeed
			|| this._profile.acc().x === 0 && Math.abs(this._profile.vel().x) < 10 * Player._minSpeed) {
			this._profile.setVel({x: 0});
		} else if (this._profile.knockbackMillis() === 0
			&& (this._profile.acc().x === 0 || Math.sign(this._profile.acc().x) !== Math.sign(this._profile.vel().x))) {
			let sideVel = this._profile.vel().x;
			if (this.getAttribute(AttributeType.GROUNDED)) {
				sideVel *= 1 / (1 + Player._friction * millis / 1000);
			} else {
				sideVel *= 1 / (1 + Player._airResistance * millis / 1000);
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
					const volume = Fns.interp(InterpType.SQUARE, Fns.normalizeRange(-0.1, this._profile.vel().y, -Player._maxVerticalVel));
					this.soundPlayer().playFromSelf(SoundType.FOOTSTEP, {
						volume: settings.soundVolume() * volume,
					});
				}

				this._canJump = true;
				this._canDoubleJump = true;
				this._canJumpTimer.start(Player._jumpGracePeriod);
			}
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		const millis = stepData.millis;
		const realMillis = stepData.realMillis;

		if (this.isSource() || this.clientIdMatches()) {
			this.setAttribute(AttributeType.GROUNDED, this._canJumpTimer.millisLeft() > 0);
		}

		// Check for nearby interactables
		if (this._interactRateLimiter.check(realMillis)) {
			// Need to use render position for circular levels
			const pos = this._profile.pos();
			const width = this._profile.width();
			const height = this._profile.height();
			const bounds = MATTER.Bounds.create([
				{ x: pos.x - width / 2 - 1, y: pos.y - height / 2 - 1 },
				{ x: pos.x + width / 2 + 1, y: pos.y - height / 2 - 1 },
				{ x: pos.x + width / 2 + 1, y: pos.y + height / 2 },
				{ x: pos.x - width / 2 - 1, y: pos.y + height / 2 },
			]);
			const bodies = MATTER.Query.region(game.physics().world().bodies, bounds);

			let nearestInteractable : InteractEntity = null;
			let currentDistSq : number = null;
			for (let i = 0; i < bodies.length; ++i) {
				const [entity, ok] = game.physics().queryEntity(bodies[i]);
				if (!ok || !entity.allTypes().has(EntityType.INTERACTABLE) || this.id() === entity.id()) {
					continue;
				}
				const interactable = <InteractEntity>entity;
				const distSq = pos.distSq(entity.profile().pos());
				if (nearestInteractable === null || distSq < currentDistSq) {
					nearestInteractable = interactable;
					currentDistSq = distSq
				}
			}

			// Swap nearest interactable, if any.
			if (this._nearestInteractable.has()) {
				this._nearestInteractable.get().setInteractableWith(this, false);
				this._nearestInteractable.clear();
			}
			if (nearestInteractable !== null) {
				nearestInteractable.setInteractableWith(this, true);
				this._nearestInteractable.set(nearestInteractable);
			}
		}

		// Interact with stuff
		// TODO: put in update?
		if (this._nearestInteractable.has()
			&& this._nearestInteractable.get().canInteractWith(this)
			&& this.key(KeyType.INTERACT, KeyState.PRESSED)) {
			this._nearestInteractable.get().interactWith(this);
			this._interactRateLimiter.prime();
		}

		const healthPercent = this.healthPercent();
		if (this.getAttribute(AttributeType.REVIVING)) {
			const [reviver, hasReviver] = game.entities().getEntity(this._reviverId);

			if (!hasReviver || !reviver.allTypes().has(EntityType.PLAYER)) {
				this.cancelRevive();
			} else {
				const distSq = reviver.profile().pos().distSq(this._profile.pos());
				if (distSq > 4) {
					this.cancelRevive();
				} else {
					if (this.clientIdMatches()) {
						ui.showTooltip(TooltipType.BEING_REVIVED, {
							ttl: 500,
							names: [reviver.displayName(), "" + Math.floor(100 * this.healthPercent())],
						});
					}
					if (reviver.clientIdMatches()) {
						ui.showTooltip(TooltipType.REVIVING, { names: [this.displayName(), "" + Math.floor(100 * this.healthPercent())] });
					}

					if (this._heartRateLimiter.checkPercent(millis, Math.max(0.3, 1 - healthPercent))) {
						const [particle, hasParticle] = this.addEntity<TextParticle>(EntityType.TEXT_PARTICLE, {
							offline: true,
							ttl: 500 + healthPercent * 500,
							profileInit: {
								pos: this._profile.pos().clone().add({ x: Fns.randomNoise(0.3) }),
								vel: { x: 0, y: 0.02 + healthPercent * 0.01 },
							},
						});

						if (hasParticle) {
							particle.setText({
								text: "❤️",
								height: 0.7 + healthPercent * 0.3,
								textColor: ColorFactory.toString(ColorType.RED),
							});
						}
					}
				}
			}
		}

		// Sweat
		// TODO: move this and other particles to ParticleFactory
		if (!this.dead() && healthPercent <= 0.5 && this._sweatRateLimiter.checkPercent(millis, Math.max(0.2, healthPercent))) {
			const weight = 1 - healthPercent;

			const dim = this._profile.dim();
			const headAngle = this._headSubProfile.angleDeg();
			const forward = Vec2.fromVec({ x: 1.3, y: 0 }).rotateDeg(headAngle);
			for (let i = 0; i < 4; ++i) {
				const sign = forward.x < 0 ? -1 : 1;
				const dir = forward.clone().rotateDeg(sign * Player._sweatDegs[i]);
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
		if (healthPercent <= 0.15) {
			this.emote(EmotionType.SAD, 0.3);
		}

		// Animation
		if (this._model.hasMesh()) {
			if (!this._attributes.getAttribute(AttributeType.GROUNDED) || this.dead()) {
				this._model.playAnimation(Animation.JUMP);
			} else if (Math.abs(this._profile.acc().x) > 1e-2) {
				this._model.playAnimation(Animation.WALK, {
					speedRatio: 0.3 + 1.2 * Math.abs(this._profile.vel().x / Player._maxWalkingVel),
				});

				if (Math.abs(this._profile.vel().x) > 0.1 && this._walkSmokeRateLimiter.check(millis)) {
					const scale = 0.4 + 0.1 * Math.random();
					this.addEntity(EntityType.SMOKE_PARTICLE, {
						offline: true,
						ttl: 600,
						profileInit: {
							pos: this._profile.getRelativePos(CardinalDir.BOTTOM, { x: scale, y: scale }),
							vel: { x: -0.05 * Math.sign(this._profile.vel().x), y: 0 },
							acc: { x: 0.05 * Math.sign(this._profile.vel().x), y: 0.1 },
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
				this._model.playAnimation(Animation.IDLE);
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

		if (this._damageTimer.hasTimeLeft() && this._baseMaterial.has()) {
			const weight = 1 - this._damageTimer.percentElapsed();
			this.setDamageEffect(weight);
		}

		if (this._nameTag !== null) {
			this._nameTag.setBarWidth(this.healthPercent());
		}
	}

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();

		const tablet = game.tablet(this.clientId());
		hudData.set(HudType.HEALTH, {
			percentGone: 1 - this._resources.healthPercent(),
			count: this._resources.health(),
			color: this.clientColorOr("#000000"),
			keyLives: tablet.getInfo(InfoType.LIVES),
		});

		this._entityTrackers.getEntities<Beak>(EntityType.BEAK).execute((beak : Beak) => {
			beak.getHudData().forEach((counter : HudOptions, type : HudType) => {
				hudData.set(type, counter);
			});
		});

		if (this._entityTrackers.hasEntityType(EntityType.BEAK) && this.clientIdMatches()) {
			hudData.set(HudType.MOUSE_LOCK, {
				charging: !ui.pointerLocked(),
				empty: true,
				color: this.clientColorOr("#000000"),
				keyType: KeyType.POINTER_LOCK,
			});
		}

		this._entityTrackers.getEntities<Equip<Player>>(EntityType.EQUIP).execute((equip : Equip<Player>) => {
			equip.getHudData().forEach((counter : HudOptions, type : HudType) => {
				hudData.set(type, counter);
			});
		});
		return hudData;
	}

	setInteractableWith(entity : Entity, interactable : boolean) : void {
		if (entity.clientIdMatches()) {
			if (interactable && this.canBeRevived(entity)) {
				ui.showTooltip(TooltipType.REVIVE, { ttl: 500, names: [this.displayName()] });
			}
		}
	}
	canInteractWith(entity : Entity) : boolean {
		return this.canBeRevived(entity);
	}
	private canBeRevived(other : Entity) : boolean {
		if (!game.controller().allowRevives()) {
			return false;
		}
		if (this.id() === other.id()) {
			return false;
		}
		if (!other.allTypes().has(EntityType.PLAYER)) {
			return false;
		}
		if (!this.dead()) {
			return false;
		}
		if (this.getAttribute(AttributeType.REVIVING)) {
			return false;
		}
		if (!this.matchAssociations([AssociationType.TEAM], other)) {
			return false;
		}
		return true;
	}
	interactWith(entity : Entity) : void {
		if (this.getAttribute(AttributeType.REVIVING)) {
			return;
		}

		this._reviverId = entity.id();
		if (entity.clientIdMatches()) {
			ui.hideTooltip(TooltipType.REVIVE);
		}
		this.setAttribute(AttributeType.REVIVING, true);
	}

	private updateLoadout() : void {
		if (!this.isSource()) {
			return;
		}

		this._model.onLoad(() => {
			if (!this._entityTrackers.hasEntityType(EntityType.BEAK)) {
				const beakType = Player._beakTypes.get(this.birdType());
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

			if (!this._entityTrackers.hasEntityType(EntityType.HEADWEAR) && Player._hairTypes.has(this.birdType())) {
				const hairType = Player._hairTypes.get(this.birdType());
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

			const [equipType, altEquipType] = game.controller().getEquips(this.clientId());
			this.createEquips(equipType, altEquipType);

			this._resources.reset();
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