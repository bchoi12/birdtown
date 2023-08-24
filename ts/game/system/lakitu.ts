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
import { CounterType, KeyType } from 'ui/api'

export class Lakitu extends SystemBase implements System {
	// Horizontal length = 25 units
	private static readonly _horizontalFov = 45.2397 * Math.PI / 180;
	private static readonly _yMin = 1;
	private static readonly _offset = new BABYLON.Vector3(0, 5.0, 30.0);
	private static readonly _lookAtOffset = new BABYLON.Vector3(0, 0.5, 0);

	private _camera : BABYLON.UniversalCamera;

	private _anchor : BABYLON.Vector3;
	private _target : BABYLON.Vector3;

	constructor(scene : BABYLON.Scene) {
		super(SystemType.LAKITU);

		this.setName({ base: "lakitu" });

		this._camera = new BABYLON.UniversalCamera(this.name(), Lakitu._offset, scene);
		this._camera.fov = Lakitu._horizontalFov;
    	this._camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;

    	this._anchor = BABYLON.Vector3.Zero();
    	this._target = BABYLON.Vector3.Zero();
	}

	camera() : BABYLON.UniversalCamera { return this._camera; }
	anchor() : BABYLON.Vector3 { return this._anchor; }
	target() : BABYLON.Vector3 { return this._target; }
	direction() : BABYLON.Vector3 { return this._target.subtract(this._camera.position).normalize(); }
	rayTo(point : BABYLON.Vector3) : BABYLON.Ray {
		return new BABYLON.Ray(this._camera.position, point.subtract(this._camera.position));
	} 

	setAnchor(anchor : BABYLON.Vector3) {
		this._anchor = anchor.clone();

		if (settings.debugFreezeCamera) {
			if (game.keys().keyDown(KeyType.LEFT)) {
				this._camera.position.x -= 0.1;
			} else if (game.keys().keyDown(KeyType.RIGHT)) {
				this._camera.position.x += 0.1;
			}
			return;
		}

		this._target = this._anchor.clone();
		this._target.add(Lakitu._lookAtOffset);
		this._target.y = Math.max(Lakitu._yMin, this._target.y);

		this._camera.position.x = this._target.x;
		this._camera.position.y = this._target.y;
		this._camera.position.y = Math.max(Lakitu._yMin + Lakitu._offset.y, this._camera.position.y);
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

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		if (this.hasTargetEntity()) {
			this.setAnchor(this.targetEntity().getProfile().pos().toBabylon3());
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

		// TODO: move elsewhere
		game.entities().queryEntities<Player>({
			type: EntityType.PLAYER,
			mapQuery: {},
		}).forEach((player : Player) => {
			ui.updatePos(player.clientId(), player.getProfile().pos());
		});

		ui.updatePos(game.clientId(), this.targetEntity().getProfile().pos())
	}
}
