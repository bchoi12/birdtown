import * as BABYLON from "babylonjs";

import { game } from 'game'
import { StepData } from 'game/game_object'
import { ComponentType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { CounterType, KeyType, TooltipType } from 'ui/api'

import { CircleMap } from 'util/circle_map'
import { isLocalhost } from 'util/common'
import { RateLimiter } from 'util/rate_limiter'
import { Vec2 } from 'util/vector'

enum LakituMode {
	UNKNOWN,

	GAME,
	LEVEL,
	SPECTATE,
}

export class Lakitu extends SystemBase implements System {
	// Horizontal length = 25 units, needs to be updated if offsets are changed
	private static readonly _horizontalFov = 45.1045 * Math.PI / 180;
	// TODO: set from level
	private static readonly _yMin = -6;
	// TODO: make these dynamic
	private static readonly _targetOffset = new BABYLON.Vector3(0, 0.5, 0);
	private static readonly _cameraOffset = new BABYLON.Vector3(0, 2.5, 30.0);
	private static readonly _playerRateLimit = 250;

	private _mode : LakituMode;
	private _camera : BABYLON.UniversalCamera;
	private _offset : BABYLON.Vector3;
	private _playerRateLimiter : RateLimiter;
	private _players : CircleMap<number, Player>;
	private _fov : Vec2;

	private _anchor : BABYLON.Vector3;
	private _target : BABYLON.Vector3;

	constructor(scene : BABYLON.Scene) {
		super(SystemType.LAKITU);

		this.addNameParams({ base: "lakitu" });

		this._mode = LakituMode.GAME;
		this._camera = new BABYLON.UniversalCamera(this.name(), Lakitu._cameraOffset, scene);
		this._camera.fov = Lakitu._horizontalFov;
    	this._camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
    	this._offset = BABYLON.Vector3.Zero();
    	this._playerRateLimiter = new RateLimiter(Lakitu._playerRateLimit);
    	this._players = new CircleMap();
    	this._fov = this.computeFov();

    	this._anchor = BABYLON.Vector3.Zero();
    	this._target = BABYLON.Vector3.Zero();

    	this._camera.onProjectionMatrixChangedObservable.add(() => {
    		this._fov = this.computeFov();
    	});
	}

	camera() : BABYLON.UniversalCamera { return this._camera; }
	fov() : Vec2 { return this._fov; }
	anchor() : BABYLON.Vector3 { return this._anchor; }
	target() : BABYLON.Vector3 { return this._target; }
	direction() : BABYLON.Vector3 { return this._target.subtract(this._camera.position).normalize(); }
	rayTo(point : BABYLON.Vector3) : BABYLON.Ray {
		return new BABYLON.Ray(this._camera.position, point.subtract(this._camera.position));
	}

	setAnchor(anchor : BABYLON.Vector3) {
		this._anchor.copyFrom(anchor);

		this._target = this._anchor.clone();
		this._target.addInPlace(this._offset);
		this._target.y = Math.max(Lakitu._yMin + this._fov.y / 2, this._target.y);
		this._target.addInPlace(Lakitu._targetOffset);

		this._camera.position = this._target.clone();
		this._camera.position.addInPlace(Lakitu._cameraOffset);
		this._camera.setTarget(this._target);
	}

	override setTargetEntity(entity : Entity) {
		if (!entity.hasComponent(ComponentType.PROFILE)) {
			console.log("Error: target entity %s must have profile", this.name());
			return;
		}
		super.setTargetEntity(entity);

		game.world().scene().audioListenerPositionProvider = () => {
		  return entity.getProfile().pos().toBabylon3();
		};
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);
		const realMillis = stepData.realMillis;

		if (this._mode === LakituMode.SPECTATE) {
			if (this._playerRateLimiter.check(realMillis)) {
				game.entities().queryEntities<Player>({
					type: EntityType.PLAYER,
					mapQuery: {
						filter: (player : Player) => {
							return player.initialized() && !player.deleted();
						}
					},
				}).forEach((player : Player) => {
					if (!this._players.has(player.id())) {
						this._players.push(player.id(), player);
					}
				});
			}
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		// Move during postPhysics so we can do camera position-based smoothing in preRender
		switch (this._mode) {
		case LakituMode.LEVEL:
			break;
		case LakituMode.SPECTATE:
			if (this._players.empty()) {
				return;
			}

			if (!this.hasTargetEntity()) {
				this.setTargetEntity(this._players.getHead());
			}

			if (game.keys().keyPressed(KeyType.LEFT)) {
				const [targetId, ok] = this._players.rewindAndDelete(this.targetEntity().id(), (player : Player) => {
					return player.initialized() && !player.deleted();
				});
				if (ok) {
					this.setTargetEntity(this._players.get(targetId));
				}
			} else if (game.keys().keyPressed(KeyType.RIGHT)) {
				const [targetId, ok] = this._players.seekAndDelete(this.targetEntity().id(), (player : Player) => {
					return player.initialized() && !player.deleted();
				});
				if (ok) {
					this.setTargetEntity(this._players.get(targetId));
				}
			}
			// fallthrough
		case LakituMode.GAME:
			if (this.hasTargetEntity()) {
				this.setAnchor(this.targetEntity().getProfile().pos().toBabylon3());
			}
			break;
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.hasTargetEntity()) {
			return;
		}

		const counts = this.targetEntity().getCounts();
		let counters = new Array<UiMessage>;
		counts.forEach((count : number, type : CounterType) => {
			let counterMsg = new UiMessage(UiMessageType.COUNTER);
			counterMsg.setProp<CounterType>(UiProp.TYPE, type);
			counterMsg.setProp<number>(UiProp.COUNT, count);
			counters.push(counterMsg);
		});

		let countersMsg = new UiMessage(UiMessageType.COUNTERS);
		countersMsg.setProp<Array<UiMessage>>(UiProp.COUNTERS, counters);
		ui.handleMessage(countersMsg);

		// TODO: rate limit?
		if (!this.targetEntity().clientIdMatches()) {
			let tooltipMsg = new UiMessage(UiMessageType.TOOLTIP);
			tooltipMsg.setProp<TooltipType>(UiProp.TYPE, TooltipType.SPECTATING);
			tooltipMsg.setProp<number>(UiProp.TTL, 50);
			if (game.clientStates().hasClientState(this.targetEntity().clientId())) {
				tooltipMsg.setProp<Array<string>>(UiProp.NAMES, [game.clientState(this.targetEntity().clientId()).displayName()]);
			}
			ui.handleMessage(tooltipMsg);
		}
	}

	private computeFov() : Vec2 {
		let fov = Vec2.zero();
		const dist = Lakitu._cameraOffset.length();
		fov.x = 2 * dist * Math.tan(this._camera.fov / 2);
		fov.y = fov.x / game.engine().getScreenAspectRatio();

		if (isLocalhost()) {
			console.log("%s: computed new fov %s", this.name(), fov.toString());
		}
		return fov;
	}
}
