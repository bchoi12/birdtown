import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { ColorType, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { StepData } from 'game/game_object'
import { Recoil } from 'game/util/recoil'

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

export type WeaponConfig = {
	times : Map<WeaponState, number>;
	bursts : number;

	// If true, do not reload until the clip is empty
	allowPartialClip? : boolean;

	// If true, stop firing when mouse releases even if clip is not empty
	interruptable? : boolean;
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

export abstract class Weapon extends Equip<Player> {

	private static readonly _shootNodeName = "shoot";
	private static readonly _recoil = new Map<RecoilType, Recoil>([
		[RecoilType.NONE, new Recoil()],
		[RecoilType.SMALL, new Recoil().setDist(0.1)],
		[RecoilType.MEDIUM, new Recoil().setDist(0.2)],
		[RecoilType.LARGE, new Recoil().setDist(0.3)],
		[RecoilType.THROW, new Recoil().setDist(0.1).setRotation({ y: Math.PI / 4 })],
		[RecoilType.WHIP, new Recoil().setDist(0.2).setRotation({ z: Math.PI / 5 })],
	]);

	protected _charging : boolean;
	protected _charged : boolean;
	protected _charger : Stopwatch;
	protected _weaponState : WeaponState;
	protected _stateTimer : Timer;
	protected _bursts : number;
	protected _firingTime : number;
	protected _playReloadSound : boolean;

	protected _shootNode : BABYLON.TransformNode;

	protected _model : Model;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.WEAPON);

		this._charging = false;
		this._charged = false;
		this._charger = new Stopwatch();
		this._weaponState = WeaponState.IDLE;
		this._stateTimer = this.newTimer({ canInterrupt: true });
		this._bursts = this.weaponConfig().bursts;
		this._firingTime = this.getTime(WeaponState.FIRING);
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
	private shootNode() : BABYLON.TransformNode { return this._shootNode !== null ? this._shootNode : this._model.root(); }
	shootPos() : Vec3 {
		// TODO: this will not reflect one frame of movement
		const node = this.shootNode();
		return Vec3.fromBabylon3(node.getAbsolutePosition());
	}

	weaponState() : WeaponState { return this._weaponState; }
	abstract weaponConfig() : WeaponConfig;
	bursts() : number { return this._bursts; }
	timer() : Timer { return this._stateTimer; }
	getTime(state : WeaponState) : number {
		const config = this.weaponConfig();
		if (config.times.has(state)) {
			return config.times.get(state);
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
	protected fire(stepData : StepData) : void {
		if (this._bursts <= 0) {
			return;
		}
		this.recordUse();
	}
	protected override simulateUse(uses : number) : void {
		this._bursts -= uses;
		if (this._bursts < 0) {
			this._bursts = 0;
		}
		this.recoil();
	}
	recoil() : void {
		if (this.hasOwner() && this.attachType() === AttachType.ARM) {
			this.owner().armRecoil(Weapon.recoil(this.recoilType()))
		}
	}
	protected recoilType() : number { return RecoilType.NONE; }
	static recoil(type : RecoilType) : Recoil { return Weapon._recoil.get(type); }

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
		this._bursts = this.weaponConfig().bursts;
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
			count: this.bursts(),
			percentGone: 1 - (this.reloading() && !this.weaponConfig().interruptable ? this.reloadPercent() : (this.bursts() / this.weaponConfig().bursts)),
			color: this.clientColorOr(ColorFactory.color(ColorType.WHITE).toString()),
			keyType: KeyType.MOUSE_CLICK,
		});

		return hudData;
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

		this.setCanUse(!this.reloading());

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._weaponState === WeaponState.RELOADING) {
			this.setCharging(false);

			if (!this.weaponConfig().allowPartialClip) {
				this._bursts = Math.max(this._bursts, Math.floor(this._stateTimer.percentElapsed() * this.weaponConfig().bursts));
			}
			if (!this._stateTimer.hasTimeLeft()) {
				this.setWeaponState(WeaponState.IDLE);
			}
		}

		if (this._weaponState === WeaponState.IDLE) {
			this._bursts = this.weaponConfig().bursts;
			if (this.firing()) {
				this.setWeaponState(WeaponState.REVVING);
			}
		}

		if (this._weaponState === WeaponState.REVVING) {
			this._bursts = this.weaponConfig().bursts;
			this._firingTime = this.getTime(WeaponState.FIRING);

			if (!this._stateTimer.hasTimeLeft()) {
				this.fire(stepData);
				this.setWeaponState(WeaponState.FIRING);
			} else if (!this.firing() && this.weaponConfig().interruptable) {
				this.setWeaponState(WeaponState.IDLE);
			}
		}

		if (this._weaponState === WeaponState.FIRING) {
			if (this._bursts <= 0) {
				this.setWeaponState(WeaponState.RELOADING);
			} else if (!this.firing() && this.weaponConfig().interruptable) {
				if (this.weaponConfig().allowPartialClip) {
					this.setWeaponState(WeaponState.IDLE);
				} else {
					this.setWeaponState(WeaponState.RELOADING);
				}
			} else if (!this._stateTimer.hasTimeLeft()) {
				this.fire(stepData);

				if (this._bursts > 0) {
					this._stateTimer.start(this._firingTime);
				} else {
					this.setWeaponState(WeaponState.RELOADING);
				}
			}
		}
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
			this._bursts = this.weaponConfig().bursts;
			if (this._weaponState === WeaponState.RELOADING) {
				if (this._playReloadSound && this.hasOwner()) {
					this.soundPlayer().playFromEntity(this.reloadSound(), this.owner(), {});
				}
			}
			break;
		}

		this._weaponState = state;
	}
}
