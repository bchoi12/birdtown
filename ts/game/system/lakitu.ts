import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameState, PlayerRole, GameObjectState } from 'game/api'
import { StepData } from 'game/game_object'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { CounterType, KeyType, TooltipType } from 'ui/api'

import { CircleMap } from 'util/circle_map'
import { isLocalhost } from 'util/common'
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

	private static readonly _playerRateLimit = 250;

	private _camera : BABYLON.UniversalCamera;

	private _playerRateLimiter : RateLimiter;
	private _players : CircleMap<number, Player>;

	private _offsets : Map<OffsetType, BABYLON.Vector3>;
	private _anchor : BABYLON.Vector3;
	private _target : BABYLON.Vector3;
	private _fov : Vec2;

	constructor(scene : BABYLON.Scene) {
		super(SystemType.LAKITU);

		this._camera = new BABYLON.UniversalCamera(this.name(), BABYLON.Vector3.Zero(), scene);
		this._camera.fov = Lakitu._horizontalFov;
    	this._camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;

    	this._offsets = new Map([
    		[OffsetType.ANCHOR, BABYLON.Vector3.Zero()],
    		[OffsetType.TARGET, new BABYLON.Vector3(0, 0.5, 0)],
    		[OffsetType.CAMERA, new BABYLON.Vector3(0, 2.5, 30.0)],
    	]);
    	this._anchor = BABYLON.Vector3.Zero();
    	this._target = BABYLON.Vector3.Zero();
    	this._fov = Vec2.zero();
    	this._camera.onProjectionMatrixChangedObservable.add(() => {
    		this.computeFov();
    	});

    	this.setAnchor(BABYLON.Vector3.Zero());
		game.scene().audioListenerPositionProvider = () => {
			return this._target;
		};
	}

	camera() : BABYLON.UniversalCamera { return this._camera; }
	aspect() : number { return this._fov.y === 0 ? 1 : this._fov.x / this._fov.y; }
	fov() : Vec2 { return this._fov; }
	anchor() : BABYLON.Vector3 { return this._anchor; }
	target() : BABYLON.Vector3 { return this._target; }
	offset(type : OffsetType) : BABYLON.Vector3 { return this._offsets.get(type); }
	direction() : BABYLON.Vector3 { return this._target.subtract(this._camera.position).normalize(); }
	rayTo(point : BABYLON.Vector3) : BABYLON.Ray {
		return new BABYLON.Ray(this._camera.position, point.subtract(this._camera.position));
	}

	private setOffset(type : OffsetType, vec : Vec) : void {
		let offset = this.offset(type);
		if (vec.hasOwnProperty("x")) { offset.x = vec.x; }
		if (vec.hasOwnProperty("y")) { offset.y = vec.y; }
		if (vec.hasOwnProperty("z")) { offset.z = vec.z; }
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
		this._target.y = Math.max(game.level().bounds().min.y + this._fov.y / 2, this._target.y);
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
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.GAME_STATE:
			switch (msg.getGameState()) {
			case GameState.SETUP:
				this.setOffset(OffsetType.TARGET, {x: 0, y: -5, z: 0});
				this.setOffset(OffsetType.CAMERA, {x: 0, y: 0, z: 60});
				break;
			default:
				this.setOffset(OffsetType.TARGET, {x: 0, y: 0.5, z: 0});
				this.setOffset(OffsetType.CAMERA, {x: 0, y: 2.5, z: 30});
			}
			break;
		}
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);
		const realMillis = stepData.realMillis;

		if (game.playerState().role() === PlayerRole.SPECTATING) {
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

		// Move during postPhysics so we can do camera position-based smoothing in preRender
		switch (game.controller().gameState()) {
		case GameState.FREE:
			if (game.playerState().hasTargetEntity()) {
				this.setTargetEntity(game.playerState().targetEntity());
			}
			break;
		case GameState.SETUP:
			const plane = game.entities().getMap(EntityType.PLANE).findN((plane : Entity) => {
				return plane.initialized();
			}, 1);
			if (plane.length === 1) {
				this.setTargetEntity(plane[0]);
			}
			break;
		case GameState.GAME:
			if (game.playerState().role() === PlayerRole.SPECTATING) {
				if (this._players.empty()) {
					break;
				}
				if (!this.validTargetEntity()) {
					this.setTargetEntity(this._players.getHead());
				}

				if (game.keys().getKey(KeyType.LEFT).pressed()) {
					const [targetId, ok] = this._players.rewindAndDelete(this.targetEntity().id(), (player : Player) => {
						return player.initialized() && !player.deleted();
					});
					if (ok) {
						this.setTargetEntity(this._players.get(targetId));
					}
				} else if (game.keys().getKey(KeyType.RIGHT).pressed()) {
					const [targetId, ok] = this._players.seekAndDelete(this.targetEntity().id(), (player : Player) => {
						return player.initialized() && !player.deleted();
					});
					if (ok) {
						this.setTargetEntity(this._players.get(targetId));
					}
				}
			} else if (game.playerState().hasTargetEntity()) {
				if (game.playerState().targetEntity().state() === GameObjectState.NORMAL) {
					this.setTargetEntity(game.playerState().targetEntity());
				} else {
					// TODO: refactor this duplication
					const plane = game.entities().getMap(EntityType.PLANE).findN((plane : Entity) => {
						return plane.initialized();
					}, 1);
					if (plane.length === 1) {
						this.setTargetEntity(plane[0]);
					}
				}
			}
			break;
		case GameState.FINISH:
			// TODO: pan to spotlighted player
			break;
		case GameState.VICTORY:
			// TODO: pan to winner
			break;
		case GameState.ERROR:
			this.clearTargetEntity();
			break;
		}

		if (this.validTargetEntity()) {
			this.setAnchor(this.targetEntity().getProfile().pos().toBabylon3());
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.validTargetEntity()) {
			return;
		}

		this.setAnchor(this.targetEntity().getProfile().pos().toBabylon3());

		const counts = this.targetEntity().getCounts();
		let countersMsg = new UiMessage(UiMessageType.COUNTERS);
		countersMsg.setCountersMap(counts);
		ui.handleMessage(countersMsg);

		// TODO: rate limit?
		if (game.playerState().role() === PlayerRole.SPECTATING) {
			let tooltipMsg = new UiMessage(UiMessageType.TOOLTIP);
			tooltipMsg.setTooltipType(TooltipType.SPECTATING);
			tooltipMsg.setTtl(250);
			if (game.playerStates().hasPlayerState(this.targetEntity().clientId())) {
				tooltipMsg.setNames([game.playerState(this.targetEntity().clientId()).displayName()]);
			}
			ui.handleMessage(tooltipMsg);
		}
	}

	private validTargetEntity() : boolean { return this.hasTargetEntity() && !this.targetEntity().deleted(); }

	private computeFov() : void {
		const aspect = game.engine().getScreenAspectRatio();
		if (aspect <= 0) {
			console.error("%s: cannot compute FOV, aspect ratio is invalid", this.name(), aspect);
			return;
		}

		const dist = this.offset(OffsetType.CAMERA).length();
		this._fov.x = 2 * dist * Math.tan(this._camera.fov / 2);
		this._fov.y = this._fov.x / aspect;

		if (isLocalhost()) {
			console.log("%s: computed new FOV", this.name(), this._fov);
		}
	}
}
