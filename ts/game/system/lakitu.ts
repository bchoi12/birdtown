import * as BABYLON from "babylonjs";

import { game } from 'game'
import { GameState } from 'game/api'
import { StepData } from 'game/game_object'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { SystemType, LakituMode } from 'game/system/api'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { CounterType, KeyType, TooltipType } from 'ui/api'

import { CircleMap } from 'util/circle_map'
import { defined, isLocalhost } from 'util/common'
import { RateLimiter } from 'util/rate_limiter'
import { Vec, Vec2 } from 'util/vector'

enum OffsetType {
	UNKNOWN,

	ANCHOR,
	TARGET,
	CAMERA,
}

export class Lakitu extends SystemBase implements System {
	// Horizontal length = 25 units, needs to be updated if offsets are changed
	private static readonly _horizontalFov = 45.1045 * Math.PI / 180;
	// TODO: set from level
	private static readonly _yMin = -6;

	private static readonly _playerRateLimit = 250;
	private static readonly _deadTimeLimit = 2000;

	private _mode : LakituMode;
	private _camera : BABYLON.UniversalCamera;

	private _playerRateLimiter : RateLimiter;
	private _players : CircleMap<number, Player>;

	private _offsets : Map<OffsetType, BABYLON.Vector3>;
	private _anchor : BABYLON.Vector3;
	private _target : BABYLON.Vector3;
	private _vel : BABYLON.Vector3;
	private _fov : Vec2;

	constructor(scene : BABYLON.Scene) {
		super(SystemType.LAKITU);

		this.addNameParams({ base: "lakitu" });

		this._mode = LakituMode.GAME;
		this._camera = new BABYLON.UniversalCamera(this.name(), BABYLON.Vector3.Zero(), scene);
		this._camera.fov = Lakitu._horizontalFov;
    	this._camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;

    	this._playerRateLimiter = new RateLimiter(Lakitu._playerRateLimit);
    	this._players = new CircleMap();

    	this._offsets = new Map([
    		[OffsetType.ANCHOR, BABYLON.Vector3.Zero()],
    		[OffsetType.TARGET, new BABYLON.Vector3(0, 0.5, 0)],
    		[OffsetType.CAMERA, new BABYLON.Vector3(0, 2.5, 30.0)],
    	]);
    	this._anchor = BABYLON.Vector3.Zero();
    	this._target = BABYLON.Vector3.Zero();
    	this._vel = BABYLON.Vector3.Zero();
    	this._fov = Vec2.zero();
    	this._camera.onProjectionMatrixChangedObservable.add(() => {
    		this._fov = this.computeFov();
    	});

    	this.setAnchor(BABYLON.Vector3.Zero());
	}

	camera() : BABYLON.UniversalCamera { return this._camera; }
	fov() : Vec2 { return this._fov; }
	anchor() : BABYLON.Vector3 { return this._anchor; }
	target() : BABYLON.Vector3 { return this._target; }
	offset(type : OffsetType) : BABYLON.Vector3 { return this._offsets.get(type); }
	direction() : BABYLON.Vector3 { return this._target.subtract(this._camera.position).normalize(); }
	rayTo(point : BABYLON.Vector3) : BABYLON.Ray {
		return new BABYLON.Ray(this._camera.position, point.subtract(this._camera.position));
	}

	setMode(mode : LakituMode) : void {
		if (this._mode === mode) {
			return;
		}

		switch (mode) {
		case LakituMode.LEVEL:
			this._vel.x = 1.5;
			this.setOffset(OffsetType.CAMERA, {x: 10, z: 60});
			break;
		default:
			this._vel.x = 0;
			this.setOffset(OffsetType.CAMERA, {x: 0, z: 30});
		}
		this._mode = mode;
	}
	private setOffset(type : OffsetType, vec : Vec) : void {
		let offset = this.offset(type);
		if (defined(vec.x)) {
			offset.x = vec.x;
		}
		if (defined(vec.y)) {
			offset.y = vec.y;
		}
		if (defined(vec.z)) {
			offset.z = vec.z;
		}
		this.computeFov();
	}
	addAnchor(delta : BABYLON.Vector3) : void {
		this._anchor.addInPlace(delta);
		this.move(this._anchor);
	}
	setAnchor(anchor : BABYLON.Vector3) : void {
		this._anchor.copyFrom(anchor);
		this._anchor.addInPlace(this.offset(OffsetType.ANCHOR));
		this.move(this._anchor);
	}
	private move(anchor : BABYLON.Vector3) : void {
		this._target = anchor.clone();
		this._target.y = Math.max(Lakitu._yMin + this._fov.y / 2, this._target.y);
		this._target.addInPlace(this.offset(OffsetType.TARGET));

		this._camera.position = this._target.clone();
		this._camera.position.addInPlace(this.offset(OffsetType.CAMERA));
		this._camera.setTarget(this._target);
	}

	override setTargetEntity(entity : Entity) {
		if (!entity.hasProfile()) {
			console.log("Error: target entity %s must have profile", entity.name());
			return;
		}
		super.setTargetEntity(entity);

		game.world().scene().audioListenerPositionProvider = () => {
			return entity.getProfile().pos().toBabylon3();
		};
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.GAME_STATE:
			const state = msg.get<GameState>(GameProp.STATE);
			switch (state) {
			case GameState.SETUP:
				this.setMode(LakituMode.LEVEL);
				break;
			default:
				this.setMode(LakituMode.GAME);
			}
			break;
		}
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);
		const realMillis = stepData.realMillis;

		if (this._mode === LakituMode.SPECTATE) {
			if (this._playerRateLimiter.check(realMillis)) {
				game.entities().getMap(EntityType.PLAYER).executeIf<Player>((player : Player) => {
					if (!this._players.has(player.id())) {
						this._players.push(player.id(), player);
					}
				}, (player : Player) => {
					return player.initialized() && !player.deleted();
				});
			}
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);
		const millis = stepData.millis;
		const seqNum = stepData.seqNum;

		// Move during postPhysics so we can do camera position-based smoothing in preRender
		switch (this._mode) {
		case LakituMode.LEVEL:
			const side = game.level().bounds().xSide({x: this._anchor.x });
			if (side !== 0 && Math.sign(this._vel.x) === side) {
				this._vel.x *= -1;
			}
			this.addAnchor(this._vel.scale(millis / 1000));
			break;
		case LakituMode.SPECTATE:
			if (this._players.empty()) {
				return;
			}
			if (!this.validTargetEntity()) {
				this.setTargetEntity(this._players.getHead());
			}

			if (game.keys().keyPressed(KeyType.LEFT, seqNum)) {
				const [targetId, ok] = this._players.rewindAndDelete(this.targetEntity().id(), (player : Player) => {
					return player.initialized() && !player.deleted();
				});
				if (ok) {
					this.setTargetEntity(this._players.get(targetId));
				}
			} else if (game.keys().keyPressed(KeyType.RIGHT, seqNum)) {
				const [targetId, ok] = this._players.seekAndDelete(this.targetEntity().id(), (player : Player) => {
					return player.initialized() && !player.deleted();
				});
				if (ok) {
					this.setTargetEntity(this._players.get(targetId));
				}
			}
			// fallthrough
		case LakituMode.GAME:
			if (this.validTargetEntity() && this.targetEntity<Player>().timeDead() < Lakitu._deadTimeLimit) {
				this.setAnchor(this.targetEntity().getProfile().pos().toBabylon3());
			} else {
				this.setMode(LakituMode.SPECTATE);
			}
			break;
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.validTargetEntity()) {
			return;
		}

		const counts = this.targetEntity().getCounts();
		let counters = new Array<UiMessage>;
		counts.forEach((count : number, type : CounterType) => {
			let counterMsg = new UiMessage(UiMessageType.COUNTER);
			counterMsg.set<CounterType>(UiProp.TYPE, type);
			counterMsg.set<number>(UiProp.COUNT, count);
			counters.push(counterMsg);
		});

		let countersMsg = new UiMessage(UiMessageType.COUNTERS);
		countersMsg.set<Array<UiMessage>>(UiProp.COUNTERS, counters);
		ui.handleMessage(countersMsg);

		// TODO: rate limit?
		if (!this.targetEntity().clientIdMatches()) {
			let tooltipMsg = new UiMessage(UiMessageType.TOOLTIP);
			tooltipMsg.set<TooltipType>(UiProp.TYPE, TooltipType.SPECTATING);
			tooltipMsg.set<number>(UiProp.TTL, 50);
			if (game.playerStates().hasPlayerState(this.targetEntity().clientId())) {
				tooltipMsg.set<Array<string>>(UiProp.NAMES, [game.playerState(this.targetEntity().clientId()).displayName()]);
			}
			ui.handleMessage(tooltipMsg);
		}
	}

	private validTargetEntity() : boolean { return this.hasTargetEntity() && !this.targetEntity().deleted(); }

	private computeFov() : Vec2 {
		let fov = Vec2.zero();
		const dist = this.offset(OffsetType.CAMERA).length();
		fov.x = 2 * dist * Math.tan(this._camera.fov / 2);
		fov.y = fov.x / game.engine().getScreenAspectRatio();

		return fov;
	}
}
