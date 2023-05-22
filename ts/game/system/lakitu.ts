import * as BABYLON from "babylonjs";

import { ComponentType } from 'game/component/api'
import { Health } from 'game/component/health'
import { Profile } from 'game/component/profile'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { Entity } from 'game/entity'

import { ui } from 'ui'
import { CounterType } from 'ui/api'

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

	setAnchor(anchor : BABYLON.Vector3) {
		this._anchor = anchor.clone();

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
	}

	override postPhysics(millis : number) : void {
		super.postPhysics(millis);

		if (this.hasTargetEntity()) {
			const profile = this.targetEntity().getComponent<Profile>(ComponentType.PROFILE);
			this.setAnchor(profile.pos().toBabylon3());
		}
	}

	override preRender(millis : number) : void {
		super.preRender(millis);

		if (!this.hasTargetEntity()) {
			return;
		}

		if (this.targetEntity().hasComponent(ComponentType.HEALTH)) {
			const health = this.targetEntity().getComponent<Health>(ComponentType.HEALTH);
			ui.updateCounter(CounterType.HEALTH, health.health());
		}
	}
}
