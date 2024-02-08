import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameState } from 'game/api'
import { CounterType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'

import { InterpType } from 'global/fn_globals'

import { GameMessage, GameMessageType } from 'message/game_message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, TooltipType } from 'ui/api'

import { CircleMap } from 'util/circle_map'
import { isLocalhost } from 'util/common'
import { Panner } from 'util/panner'
import { Vec, Vec2, Vec3 } from 'util/vector'

enum OffsetType {
	UNKNOWN,

	ANCHOR,
	TARGET,
	CAMERA,
}

export class Lakitu extends SystemBase implements System {
	// Horizontal length = 26 units, needs to be updated if offsets are changed
	// Formula: deg = 2 * arctan(0.5 * horizontal_fov / offset_length)
	private static readonly _horizontalFov = 46.8052155 * Math.PI / 180;

	private static readonly _playerRateLimit = 250;

	private static readonly _panTime = 1000;
	private static readonly _offsets = new Map<OffsetType, Vec3>([
		[OffsetType.ANCHOR, Vec3.zero()],
		[OffsetType.TARGET, new Vec3({ y: 0.5 })],
		[OffsetType.CAMERA, new Vec3({ y: 1.5, z: 30.0 })],
	]);

	private _camera : BABYLON.UniversalCamera;
	private _players : CircleMap<number, Player>;

	private _panners : Map<OffsetType, Panner>;
	private _anchor : BABYLON.Vector3;
	private _target : BABYLON.Vector3;
	private _fov : Vec2;

	constructor(scene : BABYLON.Scene) {
		super(SystemType.LAKITU);

		this._camera = new BABYLON.UniversalCamera(this.name(), BABYLON.Vector3.Zero(), scene);
		this._camera.fov = Lakitu._horizontalFov;
    	this._camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
    	this._players = new CircleMap();

    	this._panners = new Map();
    	Lakitu._offsets.forEach((offset : Vec3, type : OffsetType) => {
    		this._panners.set(type, new Panner(offset));
    	});

    	this._anchor = BABYLON.Vector3.Zero();
    	this._target = BABYLON.Vector3.Zero();
    	this._fov = Vec2.zero();
    	this._camera.onProjectionMatrixChangedObservable.add(() => {
    		this.computeFov();
    	});

    	this.setAnchor(BABYLON.Vector3.Zero());
		game.scene().audioListenerPositionProvider = () => { return this._target; };
	}

	camera() : BABYLON.UniversalCamera { return this._camera; }
	fov() : Vec2 { return this._fov; }
	anchor() : BABYLON.Vector3 { return this._anchor; }
	target() : BABYLON.Vector3 { return this._target; }
	private offset(type : OffsetType) : Vec3 { return this._panners.get(type).current(); }
	rayTo(point : BABYLON.Vector3) : BABYLON.Ray {
		return new BABYLON.Ray(this._camera.position, point.subtract(this._camera.position));
	}

	setAnchor(anchor : BABYLON.Vector3) : void {
		this._anchor.copyFrom(anchor);
		const offset = this.offset(OffsetType.ANCHOR);
		this._anchor.addInPlaceFromFloats(offset.x, offset.y, offset.z);
		this.move(this._anchor);
	}
	private move(anchor : BABYLON.Vector3) : void {
		this._target = anchor.clone();
		this._target.y = Math.max(game.level().bounds().min.y + this._fov.y / 2 + 1, this._target.y);
		const targetOffset = this.offset(OffsetType.TARGET);
		this._target.addInPlaceFromFloats(targetOffset.x, targetOffset.y, targetOffset.z);

		this._camera.position = this._target.clone();
		const cameraOffset = this.offset(OffsetType.CAMERA);
		this._camera.position.addInPlaceFromFloats(cameraOffset.x, cameraOffset.y, cameraOffset.z);
		this._camera.setTarget(this._target);
	}

	private targetEntityType() : EntityType {
		if (!this.hasTargetEntity()) { return EntityType.UNKNOWN; }

		return this.targetEntity().type();
	}
	private targetPlayer() : boolean {
		if (game.playerState().hasTargetEntity()) {
			if (this.hasTargetEntity() && this.targetEntity().id() === game.playerState().targetEntity().id()) {
				return true;
			}
			this._panners.forEach((panner : Panner, type : OffsetType) => {
				panner.pan({
					goal: Lakitu._offsets.get(type),
					millis: Lakitu._panTime,
					interpType: InterpType.NEGATIVE_SQUARE,
				});
			});
			this.setTargetEntity(game.playerState().targetEntity());
			return true;
		}
		return false;
	}
	private targetPlane() : boolean {
		if (this.targetEntityType() === EntityType.PLANE) {
			return true;
		}

		const plane = game.entities().getMap(EntityType.PLANE).findN((plane : Entity) => {
			return plane.initialized();
		}, 1);
		if (plane.length === 1) {
			this.setTargetEntity(plane[0]);
			this._panners.get(OffsetType.TARGET).pan({
				goal: {x: 0, y: -8, z: 0},
				millis: Lakitu._panTime,
				interpType: InterpType.NEGATIVE_SQUARE,
			});
			this._panners.get(OffsetType.CAMERA).pan({
				goal: {x: 0, y: 0, z: 80 },
				millis: Lakitu._panTime,
				interpType: InterpType.NEGATIVE_SQUARE,
			});
			return true;
		}
		return false;
	}
	private anchorToTarget() : void {
		let pos = this.targetEntity().profile().pos().clone();
		pos.add(this.targetEntity().cameraOffset());
		this.setAnchor(pos.toBabylon3());
	}
	private computeFov() : void {
		const aspect = game.engine().getScreenAspectRatio();
		if (aspect <= 0) {
			console.error("%s: cannot compute FOV, aspect ratio is invalid", this.name(), aspect);
			return;
		}

		const dist = this.offset(OffsetType.CAMERA).length();
		this._fov.x = 2 * dist * Math.tan(this._camera.fov / 2);
		this._fov.y = this._fov.x / aspect;
	}
	override setTargetEntity(entity : Entity) {
		if (!entity.hasProfile()) {
			console.log("Error: target entity %s must have profile", entity.name());
			return;
		}
		if (this.hasTargetEntity() && this.targetEntity().id() === entity.id()) {
			return;
		}

		super.setTargetEntity(entity);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		this._panners.forEach((panner : Panner, offsetType : OffsetType) => {
			if (panner.update(millis) && offsetType === OffsetType.CAMERA) {
				// Only need to recompute FOV when camera offset changes (since it moves in Z axis)
				this.computeFov();
			}
		});
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);

		if (game.playerState().role() === PlayerRole.WAITING || game.playerState().role() === PlayerRole.SPECTATING) {
			// TODO: get a map from PlayerStates in postPhysics, delete this
			game.entities().getMap(EntityType.PLAYER).executeIf<Player>((player : Player) => {
				if (!this._players.has(player.id())) {
					this._players.push(player.id(), player);
				}
			}, (player : Player) => {
				return player.initialized() && !player.deleted();
			});
		} else {
			this._players.clear();
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);
		const millis = stepData.millis;

		// Move during postPhysics so we can do camera position-based smoothing in preRender
		switch (game.controller().gameState()) {
		case GameState.SETUP:
			this.targetPlane();
			break;
		case GameState.FREE:
		case GameState.GAME:
			switch (game.playerState().role()) {
			case PlayerRole.GAMING:
				this.targetPlayer();
				break;
			case PlayerRole.SPAWNING:
				this.targetPlane();
				break;
			case PlayerRole.WAITING:
			case PlayerRole.SPECTATING:
				if (this._players.empty()) {
					this.targetPlane();
					break;
				}
				if (!this.hasTargetEntity()) {
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
				break;
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

		if (this.hasTargetEntity()) {
			this.anchorToTarget();
		} else {
			this.setAnchor(game.level().defaultSpawn().toBabylon3());
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.hasTargetEntity()) {
			return;
		}

		this.anchorToTarget();
		ui.updateCounters(this.targetEntity().getCounts());

		// TODO: rate limit?
		if (game.playerState().role() === PlayerRole.SPECTATING) {
			let tooltipMsg = new UiMessage(UiMessageType.TOOLTIP);
			tooltipMsg.setTooltipType(TooltipType.SPECTATING);
			tooltipMsg.setTtl(100);
			tooltipMsg.setNames([game.tablet(this.targetEntity().clientId()).displayName()]);
			ui.handleMessage(tooltipMsg);
		}
	}
}
