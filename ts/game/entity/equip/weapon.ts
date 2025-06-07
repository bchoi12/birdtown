import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType, EmotionType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { ColorType, MaterialType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'
import { Transforms } from 'game/util/transforms'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Stopwatch } from 'util/stopwatch'
import { Timer } from 'util/timer'
import { Vec, Vec2, Vec3 } from 'util/vector'

export enum WeaponState {
	UNKNOWN,

	IDLE,
	REVVING,
	FIRING,
	RELOADING,
}

export enum RecoilType {
	UNKNOWN,

	NONE,
	SMALL,
	MEDIUM,
	LARGE,

	THROW,
	WHIP,
}
export enum ReloadType {
	UNKNOWN,

	NONE,
	DISLOCATE,
	LOWER,
	RAISE,
	RECOIL_BACK,
	RECOIL_RAISE,
	RUMMAGE,
	SLIGHT_LOWER,
	SLIGHT_RAISE,
	SPIN,
	VERTICAL,
}

export abstract class Weapon extends Equip<Player> {

	private static readonly _shootNodeName = "shoot";
	private static readonly _recoilRecoveryTime = 100;
	private static readonly _recoil = new Map<RecoilType, Transforms>([
		[RecoilType.NONE, new Transforms()],
		[RecoilType.SMALL, new Transforms({
			translate: { x: 0.1 },
		})],
		[RecoilType.MEDIUM, new Transforms({
			translate: { x: 0.2 },
		})],
		[RecoilType.LARGE, new Transforms({
			translate: { x: 0.3 },
		})],
		[RecoilType.THROW, new Transforms({
			translate: { x: 0.3 },
			rotate: { y: Math.PI / 4 },
		})],
		[RecoilType.WHIP, new Transforms({
			translate: { x: 0.2, y: 0.1 },
			rotate: { z: Math.PI / 5},
		})],
	]);

	private static readonly _reloadStartTime = 100;
	private static readonly _reloadEndTime = 150;
	private static readonly _reloadSpins = 2;
	private static readonly _reloadSpinTime = 400;

	private static readonly _recoilReloads = new Set<ReloadType>([
		ReloadType.DISLOCATE,
		ReloadType.RECOIL_BACK,
		ReloadType.RECOIL_RAISE,
	])
	private static readonly _reload = new Map<ReloadType, Transforms>([
		[ReloadType.NONE, new Transforms()],
		[ReloadType.DISLOCATE, new Transforms({
			translate: { x: 0.3, y: 0.2 },
			rotate: { z: 0.6 * Math.PI },
		})],
		[ReloadType.LOWER, new Transforms({
			translate: { y: -0.1 },
			rotate: { z: -Math.PI / 5 },
		})],
		[ReloadType.SLIGHT_LOWER, new Transforms({
			rotate: { z: -Math.PI / 6 },
		})],
		[ReloadType.SLIGHT_RAISE, new Transforms({
			rotate: { z: Math.PI / 6 },
		})],
		[ReloadType.RAISE, new Transforms({
			translate: { x: 0.2, y: 0.1 },
			rotate: { z: Math.PI / 3 },
		})],
		[ReloadType.RECOIL_BACK, new Transforms({
			translate: { x: 0.2 },
		})],
		[ReloadType.RECOIL_RAISE, new Transforms({
			translate: { x: 0.2, y: 0.1 },
			rotate: { z: Math.PI / 3 },
		})],
		[ReloadType.RUMMAGE, new Transforms({
			translate: { x: 0.1, y: -0.4 },
			rotate: { z: -Math.PI / 2 + 0.1 },
		})],
		[ReloadType.SPIN, new Transforms({
			translate: { x: 0.2, y: 0.1 },
			rotate: { z: Math.PI / 5 },
		})],
		[ReloadType.VERTICAL, new Transforms({
			translate: { x: 0.3, y: 0.2 },
			rotate: { z: Math.PI / 2 - 0.1 },
		})],
	]);

	protected _armTransforms : Transforms;
	protected _charging : boolean;
	protected _charged : boolean;
	protected _charger : Stopwatch;
	protected _weaponState : WeaponState;
	protected _stateTimer : Timer;
	protected _bursts : number;
	protected _firingTime : number;

	protected _allowPartialClip : boolean;
	protected _interruptible : boolean;
	protected _playReloadSound : boolean;

	protected _shootNode : BABYLON.TransformNode;

	protected _model : Model;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.WEAPON);

		this._armTransforms = new Transforms({
			translate: Vec3.zero(),
			rotate: Vec3.zero(),
		});
		this._charging = false;
		this._charged = false;
		this._charger = new Stopwatch();
		this._weaponState = WeaponState.IDLE;
		this._stateTimer = this.newTimer({ canInterrupt: true });
		this._bursts = this.getBursts();
		this._firingTime = this.getTime(WeaponState.FIRING);

		this._allowPartialClip = false;
		this._interruptible = false;
		this._playReloadSound = false;

		this._shootNode = null;

		this.addProp<boolean>({
			export: () => { return this._charged; },
			import: (obj : boolean) => { this._charged = obj; },
		})
		this.addProp<WeaponState>({
			has: () => { return this._weaponState !== WeaponState.UNKNOWN; },
			export: () => { return this._weaponState; },
			import: (obj : WeaponState) => { this.setWeaponState(obj); },
		});

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(this.meshType(), (result : LoadResult) => {
					let mesh = result.mesh;
					this.processMesh(mesh, result);
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.CHARGE);

		if (this.reloadSound() !== SoundType.UNKNOWN) {
			this.soundPlayer().registerSound(this.reloadSound());
		}
	}

	abstract meshType() : MeshType;
	processMesh(mesh : BABYLON.Mesh, result : LoadResult) : void {
		result.transformNodes.forEach((node : BABYLON.TransformNode) => {
			if (node.name === Weapon._shootNodeName) {
				this._shootNode = node;
			}
		});

		if (this._shootNode === null) {
			console.error("Error: no shoot node for %s", this.name());
		}
	}
	protected shootNode() : BABYLON.TransformNode { return this._shootNode !== null ? this._shootNode : this._model.root(); }
	shootPos() : Vec3 {
		// TODO: this will not reflect one frame of movement
		const node = this.shootNode();
		return Vec3.fromBabylon3(node.getAbsolutePosition());
	}

	weaponState() : WeaponState { return this._weaponState; }
	ammo() : number { return this._bursts; }
	protected getBursts() : number {
		if (this.charged() && this.hasStat(StatType.CHARGED_BURSTS)) {
			return this.getStat(StatType.CHARGED_BURSTS);
		}
		return this.getStat(StatType.BURSTS);
	}
	timer() : Timer { return this._stateTimer; }
	private getTime(state : WeaponState) : number {
		switch (state) {
		case WeaponState.REVVING:
			return this.getStatOr(StatType.REV_TIME, 0);
		case WeaponState.FIRING:
			if (this.charged() && this.hasStat(StatType.CHARGED_FIRE_TIME)) {
				return this.getStat(StatType.CHARGED_FIRE_TIME);
			}
			return this.getStat(StatType.FIRE_TIME);
		case WeaponState.RELOADING:
			if (this.charged() && this.hasStat(StatType.CHARGED_RELOAD_TIME)) {
				return this.getStat(StatType.CHARGED_RELOAD_TIME);
			}
			return this.getStat(StatType.RELOAD_TIME);
		}
		return 0;
	}
	getDir() : Vec2 {
		if (this._shootNode === null) {
			return this.inputDir().clone();
		}

		let mouse = this.inputMouse().clone();
		let origin = Vec2.fromBabylon3(this.shootNode().getAbsolutePosition());

		if (game.level().isCircle()) {
			if (origin.x - mouse.x > game.level().bounds().width() / 2) {
				mouse.x += game.level().bounds().width();
			} else if (mouse.x - origin.x > game.level().bounds().width() / 2) {
				mouse.x -= game.level().bounds().width();
			}
		}

		if (origin.distSq(mouse) <= 0.25) {
			return this.inputDir().clone();
		}
		return origin.sub(mouse).negate().normalize();
	}
	getProjectileSpeed() : number {
		if (this.charged() && this.hasStat(StatType.CHARGED_PROJECTILE_SPEED)) {
			return this.getStat(StatType.CHARGED_PROJECTILE_SPEED);
		}
		return this.getStat(StatType.PROJECTILE_SPEED);
	}
	getProjectileTTL() : number {
		if (this.charged() && this.hasStat(StatType.CHARGED_PROJECTILE_TTL)) {
			return this.getStat(StatType.CHARGED_PROJECTILE_TTL);
		}
		return this.getStat(StatType.PROJECTILE_TTL);
	}
	getProjectileAccel() : number {
		if (this.charged() && this.hasStat(StatType.CHARGED_PROJECTILE_ACCEL)) {
			return this.getStat(StatType.CHARGED_PROJECTILE_ACCEL);
		}
		if (this.hasStat(StatType.PROJECTILE_ACCEL)) {
			return this.getStat(StatType.PROJECTILE_ACCEL);
		}
		return 0;
	}
	getProjectileOptions(pos : Vec2, unitDir : Vec2, angle? : number) : EntityOptions {
		let vel = unitDir.clone().scale(this.getProjectileSpeed());

		let options : EntityOptions = {
			ttl: this.getProjectileTTL(),
			associationInit: {
				owner: this.owner(),
			},
			modelInit: {},
			profileInit: {
				pos: pos,
				vel: vel,
			},
		};

		let projectileAccel = this.getProjectileAccel();
		if (projectileAccel !== 0) {
			let acc = unitDir.clone().scale(projectileAccel);
			options.profileInit.acc = acc;
		}

		if (angle) {
			options.profileInit.angle = angle;
		}

		return options;
	}

	chargedThreshold() : number { return 1000; }
	charged() : boolean { return this._charged; }
	chargeMillis() : number { return this._charger.millis(); }
	charging() : boolean { return this._charging; }
	setCharging(charging : boolean) : void {
		if (this._charging === charging) {
			return;
		}

		if (this.reloading() && charging) {
			return;
		}

		this._charging = charging;

		if (!this._charging) {
			this._charged = false;
			this._charger.reset();
		}
	}

	protected firing() : boolean {
		return this.canUse() && this.key(KeyType.MOUSE_CLICK, KeyState.DOWN) && (this.charged() || !this.charging());
	}
	fire() : void {
		if (this._bursts <= 0) {
			return;
		}
		this.recordUse();
	}
	protected override checkCanUse() : boolean { return !this.reloading(); }
	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);
		
		this._bursts -= uses;
		if (this._bursts < 0) {
			this._bursts = 0;
		}

		if (this.hasOwner()) {
			this.owner().emote(EmotionType.MAD);
		}
	}
	protected recoilType() : RecoilType { return RecoilType.NONE; }
	protected reloadSpins() : number { return Weapon._reloadSpins; }
	protected reloadType() : ReloadType { return ReloadType.NONE; }

	reloadSound() : SoundType { return SoundType.UNKNOWN; }
	reloading() : boolean { return this._weaponState === WeaponState.RELOADING; }
	reloadMillis() : number { return this._weaponState === WeaponState.RELOADING ? this._stateTimer.millisLeft() : 0; }
	reloadPercent() : number { return this._weaponState === WeaponState.RELOADING ? this._stateTimer.percentElapsed() : 1; }
	onReload() : void {
		this._bursts = 0;
		if (this.reloadSound() !== SoundType.UNKNOWN && this.hasOwner() && this.owner().isLakituTarget()) {
			this._playReloadSound = true;
		}
	}
	quickReload(millis? : number) : void {
		this._bursts = this.getBursts();
		if (millis <= 0) {
			this.setWeaponState(WeaponState.IDLE);
			this._stateTimer.reset();
		} else {
			this.setWeaponState(WeaponState.RELOADING);
			this._stateTimer.start(millis);

			this._playReloadSound = false;
		}
	}

	hudType() : HudType { return HudType.BULLETS; }
	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();
		hudData.set(this.hudType(), {
			charging: !this.canUse(),
			count: this.ammo(),
			percentGone: 1 - (this.reloading() && !this._interruptible ? this.reloadPercent() : (this.ammo() / this.getBursts())),
			color: this.clientColorOr(ColorFactory.color(ColorType.WHITE).toString()),
			keyType: KeyType.MOUSE_CLICK,
		});

		return hudData;
	}

	private setWeaponState(state : WeaponState) : void {
		if (this._weaponState === state) {
			return;
		}

		const time = this.getTime(state);
		if (time > 0) {
			this._stateTimer.start(time);
		} else {
			this._stateTimer.reset();
		}

		switch (state) {
		case WeaponState.RELOADING:
			this.onReload();
			break;
		case WeaponState.IDLE:
			this.setCharging(false);
			this._bursts = this.getBursts();
			if (this._weaponState === WeaponState.RELOADING) {
				if (this._playReloadSound && this.hasOwner()) {
					this.soundPlayer().playFromEntity(this.reloadSound(), this.owner(), {});
				}
			}
			break;
		}

		this._weaponState = state;
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);
		const millis = stepData.millis;

		if (this._charging) {
			if (this._charger.millis() === 0 && this.hasOwner() && this.owner().isLakituTarget()) {
				this.soundPlayer().playFromEntity(SoundType.CHARGE, this.owner());
			}
			this._charger.elapse(millis);
		} else {
			this.soundPlayer().stop(SoundType.CHARGE);
			this._charger.reset();
			this._charged = false;
		}

		if (this.isSource() && this.chargeMillis() >= this.chargedThreshold()) {
			this._charged = true;
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._weaponState === WeaponState.RELOADING) {
			this.setCharging(false);

			if (!this._allowPartialClip) {
				this._bursts = Math.max(this._bursts, Math.floor(this._stateTimer.percentElapsed() * this.getBursts()));
			}
			if (!this._stateTimer.hasTimeLeft()) {
				this.setWeaponState(WeaponState.IDLE);
			}
		}

		if (this._weaponState === WeaponState.IDLE) {
			this._bursts = this.getBursts();
			if (this.firing()) {
				this.setWeaponState(WeaponState.REVVING);
			}
		}

		if (this._weaponState === WeaponState.REVVING) {
			this._bursts = this.getBursts();

			if (!this._stateTimer.hasTimeLeft()) {
				this.fire();
				this._firingTime = this.getTime(WeaponState.FIRING);
				this.setWeaponState(WeaponState.FIRING);
			} else if (!this.firing() && this._interruptible) {
				this.setWeaponState(WeaponState.IDLE);
			}
		}

		if (this._weaponState === WeaponState.FIRING) {
			if (this._bursts <= 0) {
				this.setWeaponState(WeaponState.RELOADING);
			} else if (!this.firing() && this._interruptible) {
				if (this._allowPartialClip) {
					this.setWeaponState(WeaponState.IDLE);
				} else {
					this.setWeaponState(WeaponState.RELOADING);
				}
			} else if (!this._stateTimer.hasTimeLeft()) {
				this.fire();

				if (this._bursts > 0) {
					this._stateTimer.start(this._firingTime);
				} else {
					this.setWeaponState(WeaponState.RELOADING);
				}
			}
		}
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);

		if (!this.hasOwner()) {
			return;
		}

		const weight = this._stateTimer.percentElapsed();

		switch (this._weaponState) {
		case WeaponState.REVVING:
			this._armTransforms.translation().x = -0.1 * Math.random() + 0.05;
			this._armTransforms.translation().y = -0.1 * Math.random() + 0.05;
			break;
		case WeaponState.RELOADING:
			const reloadType = this.reloadType();
			let reloadWeight : number;
			if (Weapon._recoilReloads.has(reloadType)) {
				const startTime = 2 * Weapon._reloadStartTime;
				if (this._stateTimer.millisElapsed() < startTime) {
					reloadWeight = 1;
				} else {
					reloadWeight = 1 - Math.max(0, this._stateTimer.millisElapsed() - startTime) / Math.max(1, this._stateTimer.totalMillis() - startTime);
				}
			} else if (this._stateTimer.millisLeft() < Weapon._reloadEndTime) {
				reloadWeight = this._stateTimer.millisLeft() / Weapon._reloadEndTime;
			} else if (this._stateTimer.millisElapsed() < Weapon._reloadStartTime) {		
				reloadWeight = this._stateTimer.millisElapsed() / Weapon._reloadStartTime;
			} else {
				reloadWeight = 1;
			}

			const reload = Weapon._reload.get(reloadType);
			this._armTransforms.merge(reload);
			this._armTransforms.translation().scale(reloadWeight);
			this._armTransforms.rotation().scale(reloadWeight);

			if (reloadType === ReloadType.SPIN) {
				if (weight > 0.25 && weight < 0.75) {
					this._model.rotation().x = (weight - 0.25) / 0.5 * this.reloadSpins() * 2 * Math.PI;
				} else {
					this._model.rotation().x = 0;
				}
			}
			break;
		case WeaponState.FIRING:
			const recoil = Weapon._recoil.get(this.recoilType());
			const recoilWeight = 1 - Math.min(1, this._stateTimer.millisElapsed() / Weapon._recoilRecoveryTime);
			this._armTransforms.merge(recoil);
			this._armTransforms.translation().scale(recoilWeight);
			this._armTransforms.rotation().scale(recoilWeight);
			break;
		default:
			this._armTransforms.reset();
		}

		this.owner().mergeArmTransforms(this._armTransforms);
	}
}
