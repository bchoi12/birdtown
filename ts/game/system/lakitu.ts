import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameState, GameObjectState } from 'game/api'
import { AssociationType, AttributeType} from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { BuffType, ColorType } from 'game/factory/api'
import { BuffFactory } from 'game/factory/buff_factory'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, StatusType } from 'ui/api'

import { CircleMap } from 'util/circle_map'
import { isLocalhost } from 'util/common'
import { Fns, InterpType } from 'util/fns'
import { Panner } from 'util/panner'
import { Vec, Vec2, Vec3 } from 'util/vector'

enum OffsetType {
	UNKNOWN,

	ANCHOR,
	TARGET,
	CAMERA,
}

enum TargetMode {
	UNKNOWN,

	PLAYER,
	SPAWN,
	SPAWN_ZOOM,
	WINNER,
}

export class Lakitu extends SystemBase implements System {
	// Horizontal length = 32 units, needs to be updated if offsets are changed
	// Formula: deg = 2 * arctan(0.5 * horizontal_length / offset_length)
	private static readonly _horizontalFov = 48 * Math.PI / 180;
	private static readonly _screenShake = 0.04;

	private static readonly _quickPan = 300;
	private static readonly _normalPan = 1500;
	private static readonly _slowPan = 3000;
	private static readonly _offsets = new Map<OffsetType, Vec3>([
		[OffsetType.ANCHOR, Vec3.zero()],
		[OffsetType.TARGET, new Vec3({ y: 0.5 })],
		[OffsetType.CAMERA, new Vec3({ y: 3, z: 36 })],
	]);

	private _camera : BABYLON.UniversalCamera;
	private _mode : TargetMode;
	private _players : CircleMap<number, Player>;
	private _spectateClientId : number;

	private _shakeUntil : number;
	private _panners : Map<OffsetType, Panner>;
	private _anchor : BABYLON.Vector3;
	private _target : BABYLON.Vector3;
	private _fov : Vec2;

	constructor(scene : BABYLON.Scene) {
		super(SystemType.LAKITU);

		this._camera = new BABYLON.UniversalCamera(this.name(), BABYLON.Vector3.Zero(), scene);
		this._camera.fov = Lakitu._horizontalFov;
    	this._camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;
    	this._mode = TargetMode.UNKNOWN;
    	this._players = new CircleMap();
    	this._spectateClientId = 0;

    	this._shakeUntil = 0;
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
	inFOV(vec : Vec, buffer? : number) : boolean {
		if (!buffer) {
			buffer = 0;
		}

		const fov = this.fov();
		return vec.x > this._target.x - fov.x / 2 - buffer
			&& vec.x < this._target.x + fov.x / 2 + buffer
			&& vec.y > this._target.y - fov.y / 2 - buffer
			&& vec.y < this._target.y + fov.y / 2 + buffer;
	}
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
	shake(millis : number) : void {
		if (!settings.shakeScreen()) {
			return;
		}

		this._shakeUntil = Date.now() + Math.min(1000, millis);
	}
	pan(type : OffsetType, goal : Vec, millis : number) : void {
		this._panners.get(type).pan({
			goal: goal,
			millis: millis,
			interpType: InterpType.NEGATIVE_SQUARE,
		});
	}
	portrait() : void {
		this.pan(OffsetType.CAMERA, { x: 3, y: 2, z: 7 }, Lakitu._quickPan);
		this.pan(OffsetType.TARGET, { x: 0, y: 0, z: 0 }, Lakitu._quickPan);
	}

	private move(anchor : BABYLON.Vector3) : void {
		this._target = anchor.clone();
		const targetOffset = this.offset(OffsetType.TARGET);
		this._target.addInPlaceFromFloats(targetOffset.x, targetOffset.y, targetOffset.z);

		if (!game.level().isCircle()) {
			const buffer = Math.min(4, this._fov.x / 8);
			this._target.x = Fns.clamp(game.level().bounds().min.x + buffer, this._target.x, game.level().bounds().max.x - buffer);
		}
		this._target.y = Math.max(game.level().bounds().min.y + this._fov.y / 2 + 1.5, this._target.y);

		this._camera.position = this._target.clone();
		const cameraOffset = this.offset(OffsetType.CAMERA);
		this._camera.position.addInPlaceFromFloats(cameraOffset.x, cameraOffset.y, cameraOffset.z);

		this._camera.setTarget(this._target);

		if (Date.now() < this._shakeUntil) {
			this._camera.position.addInPlaceFromFloats(
				Lakitu._screenShake - 2 * Lakitu._screenShake * Math.random(),
				Lakitu._screenShake - 2 * Lakitu._screenShake * Math.random(),
				0);
		}
	}
	private resetPan(millis : number) : void {
		this._panners.forEach((panner : Panner, type : OffsetType) => {
			panner.pan({
				goal: Lakitu._offsets.get(type),
				millis: millis,
				interpType: InterpType.NEGATIVE_SQUARE,
			});
		});
	}

	private targetEntityType() : EntityType {
		if (!this.hasTargetEntity()) { return EntityType.UNKNOWN; }

		return this.targetEntity().type();
	}
	private static canSpectate(player : Player) : boolean {
		if (!game.playerInitialized()) {
			return false;
		}

		const team = game.playerState().team();
		if (team !== 0 && team !== player.team()) {
			return false;
		}

		return player.valid()
			&& player.state() !== GameObjectState.DEACTIVATED
			&& game.playerState(player.clientId()).isPlaying() && (player.clientIdMatches() || !player.dead())
			&& game.playerStates().hasPlayerState(player.clientId());
	}
	private targetPlayer() : boolean {
		if (!game.playerState().hasTargetEntity()) {
			this._mode = TargetMode.UNKNOWN;
			return false;
		}
		if (this._mode === TargetMode.PLAYER) {
			return true;
		}

		if (this._mode === TargetMode.WINNER) {
			this.resetPan(Lakitu._quickPan);
		} else {
			this.resetPan(Lakitu._slowPan);
		}
		this.setTargetEntity(game.playerState().targetEntity());
		this._mode = TargetMode.PLAYER;
		return true;
	}
	private targetWinner() : boolean {
		const winnerClientId = game.controller().winnerClientId();
		if (!game.playerStates().hasPlayerState(winnerClientId) || !game.playerState(winnerClientId).validTargetEntity()) {
			this._mode = TargetMode.UNKNOWN;
			return false;
		}
		if (this._mode === TargetMode.WINNER) {
			return true;
		}

		const winner = game.playerState(winnerClientId).targetEntity<Player>();
		this._panners.forEach((panner : Panner, type : OffsetType) => {
			if (type === OffsetType.ANCHOR) {
				const offset = Vec3.fromBabylon3(this._anchor).sub(winner.profile().pos());
				panner.snapTo(offset);
			}

			let goal = Lakitu._offsets.get(type).clone();
			if (type === OffsetType.CAMERA) {
				goal.x = 3;
				goal.y = 2;
				goal.z = 10;
			} else if (type === OffsetType.TARGET) {
				goal.y = 0;
			}
			panner.pan({
				goal: goal,
				millis: Lakitu._slowPan,
				interpType: InterpType.PAUSE_THEN_REALLY_EASE_IN,
			});
		});

		this.setTargetEntity(winner);
		this._mode = TargetMode.WINNER;
		return true;
	}
	private targetSpawn(zoom? : boolean) : boolean {
		if (game.controller().gameState() === GameState.FREE) {
			this._mode = TargetMode.UNKNOWN;
			return false;
		}

		if (!zoom) {
			zoom = false;
		}
		if (zoom && this._mode === TargetMode.SPAWN_ZOOM) {
			return true;
		}
		if (!zoom && this._mode === TargetMode.SPAWN) {
			return true;
		}
		if (this.targetSpawnPoint(zoom) || this.targetPlane(zoom)) {
			this._mode = zoom ? TargetMode.SPAWN_ZOOM : TargetMode.SPAWN;
			return true;
		}

		this._mode = TargetMode.UNKNOWN;
		return false;
	}
	private targetSpawnPoint(zoom : boolean) : boolean {
		if (!game.playerState()?.hasTargetEntity()) {
			return false;
		}
		if (!game.controller().useTeamSpawns()) {
			return false;
		}

		const spawns = game.entities().getMap(EntityType.SPAWN_POINT).findAll((spawn : Entity) => {
			return spawn.valid();
		});
		for (let i = 0; i < spawns.length; ++i) {
			if (game.playerState().targetEntity().matchAssociations([AssociationType.TEAM], spawns[i])) {
				this.setTargetEntity(spawns[i]);
				this._panners.forEach((panner : Panner, type : OffsetType) => {
					let goal : Vec3;
					if (type === OffsetType.CAMERA && zoom) {
						goal = Lakitu._offsets.get(type).clone().add({ z: -8 });
					} else {
						goal = Lakitu._offsets.get(type);
					}
					panner.pan({
						goal: goal,
						millis: Lakitu._normalPan,
						interpType: InterpType.NEGATIVE_SQUARE,
					});
				});
				return true;
			}
		}
		return false;
	}
	private targetPlane(zoom : boolean) : boolean {
		const plane = game.entities().getMap(EntityType.PLANE).findN((plane : Entity) => {
			return plane.valid();
		}, 1);
		if (plane.length === 1) {
			this.setTargetEntity(plane[0]);
			this._panners.get(OffsetType.ANCHOR).pan({
				goal: {x: 0, y: 0, z: 0},
				millis: Lakitu._normalPan,
				interpType: InterpType.NEGATIVE_SQUARE,
			});
			this._panners.get(OffsetType.TARGET).pan({
				goal: {x: 0, y: zoom ? 0 : -8, z: 0},
				millis: Lakitu._normalPan,
				interpType: InterpType.NEGATIVE_SQUARE,
			});
			this._panners.get(OffsetType.CAMERA).pan({
				goal: {x: 0, y: 0, z: zoom ? 25 : 80 },
				millis: Lakitu._normalPan,
				interpType: InterpType.NEGATIVE_SQUARE,
			});
			return true;
		}
		return false;
	}
	private anchorToTarget() : void {
		if (game.controller().gameState() !== GameState.GAME && game.controller().gameState() !== GameState.FREE) {
			this.setAnchor(this.targetEntity().profile().pos().toBabylon3());
			return;
		}
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
	override setTargetEntity(entity : Entity) : void {
		if (!entity.hasProfile()) {
			console.log("Error: target entity %s must have profile", entity.name());
			return;
		}
		if (this.hasTargetEntity() && this.targetEntity().id() === entity.id()) {
			return;
		}

		super.setTargetEntity(entity);
		ui.refreshHudColor();
	}
	override clearTargetEntity() : void {
		super.clearTargetEntity();
		this._mode = TargetMode.UNKNOWN;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.realMillis;

		this._panners.forEach((panner : Panner, offsetType : OffsetType) => {
			if (panner.update(millis) && offsetType === OffsetType.CAMERA) {
				// Only need to recompute FOV when camera offset changes (since it moves in Z axis)
				this.computeFov();
			}
		});
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);
		const millis = stepData.realMillis;

		switch (game.controller().gameState()) {
		case GameState.PRELOAD:
			// Continue current target
			break;
		case GameState.LOAD:
		case GameState.SETUP:
			this.targetSpawn();
			break;
		case GameState.FREE:
		case GameState.GAME:
			switch (game.playerState()?.role()) {
			case PlayerRole.PREPARING:
			case PlayerRole.SPAWNING:
				this.targetSpawn();
				break;
			case PlayerRole.GAMING:
				this.targetPlayer();
				break;
			case PlayerRole.WAITING:
				if (!this.targetPlayer()) {
					this.targetSpawn();
				}
				break;
			case PlayerRole.SPECTATING:
				// Add any missing players
				game.entities().getMap(EntityType.PLAYER).executeIf<Player>((player : Player) => {
					if (!this._players.has(player.id())) {
						this._players.push(player.clientId(), player);
					}
				}, (player : Player) => {
					return Lakitu.canSpectate(player);
				});

				// Remove invalid players
				this._players.deleteIf((player : Player) => {
					return !Lakitu.canSpectate(player);
				});

				if (this._players.empty()) {
					this._spectateClientId = 0;
					this.targetSpawn();
				} else {
					// Force reassign target if invalid
					if (this.targetEntityType() !== EntityType.PLAYER
						|| this.targetEntity().clientId() !== this._spectateClientId) {
						if (!this._players.has(this._spectateClientId)) {
							this._spectateClientId = this._players.head();
						}
						this.resetPan(Lakitu._slowPan);
						this.setTargetEntity(this._players.get(this._spectateClientId));
					}

					let newClientId = null;
					if (game.keys().getKey(KeyType.RIGHT).pressed()
						|| !this._players.has(this._spectateClientId)) {
						newClientId = this._players.nextAndDelete(this._spectateClientId);
					} else if (game.keys().getKey(KeyType.LEFT).pressed()) {
						newClientId = this._players.prevAndDelete(this._spectateClientId);
					}

					if (newClientId !== null && this._spectateClientId !== newClientId) {
						this._spectateClientId = newClientId;
						this.resetPan(Lakitu._quickPan);
						this.setTargetEntity(this._players.get(this._spectateClientId));
					}

					if (this.targetEntity().state() === GameObjectState.DEACTIVATED) {
						this.targetSpawn();
					}
				}
				break;
			}
			break;
		case GameState.FINISH:
		case GameState.VICTORY:
			// Pan to a winning player
			this.targetWinner();
			break;
		case GameState.END:
		case GameState.ERROR:
			this.clearTargetEntity();
			return;
		}

		if (this.validTargetEntity()) {
			this.anchorToTarget();
		} else {
			this.setAnchor(game.level().defaultSpawn().toBabylon3());
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.validTargetEntity()) {
			return;
		}

		this.anchorToTarget();

		if (this.targetEntityType() === EntityType.PLAYER) {
			// TODO: refactor these two methods into this.targetEntity().updateHud()
			ui.updateHud(this.targetEntity().getHudData());
			ui.setHudClientId(this.targetEntity().clientId());

			ui.setScreenColor(ColorType.WATER, this.targetEntity().getAttribute(AttributeType.UNDERWATER));
			ui.setScreenColor(ColorType.BLACK, this.targetEntity().getAttribute(AttributeType.COOL));

			let maxLevel = 0;
			let maxBuff = BuffType.UNKNOWN;
			BuffFactory.colors.forEach((color : ColorType, buff : BuffType) => {
				const buffLevel = this.targetEntity().buffLevel(buff);
				if (buffLevel > maxLevel) {
					maxLevel = buffLevel;
					maxBuff = buff;
				}
			});
			BuffFactory.colors.forEach((color : ColorType, buff : BuffType) => {
				ui.setScreenColor(color, buff === maxBuff);
			});
		} else {
			ui.hideHud();
			ui.setHudClientId(game.clientId());
			ui.clearScreenColors();
		}

		if (game.playerState().role() === PlayerRole.SPECTATING
			&& game.controller().gameState() !== GameState.FINISH
			&& game.controller().gameState() !== GameState.VICTORY) {
			ui.addStatus(StatusType.SPECTATING);
		} else {
			ui.clearStatus(StatusType.SPECTATING);
		}
	}
}
