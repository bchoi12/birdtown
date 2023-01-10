import * as BABYLON from "babylonjs";

import { System, SystemBase, SystemType } from 'game/system'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

// TODO: camera modes
enum Mode {
	UNKNOWN,
}

export class Lakitu extends SystemBase implements System {
	// Horizontal length = 25 units
	private static readonly _horizontalFov = 45.2397 * Math.PI / 180;
	private static readonly _yMin = 1;
	private static readonly _offset = new BABYLON.Vector3(0, 3.0, 30.0);
	private static readonly _lookAtOffset = new BABYLON.Vector3(0, 0.5, 0);

	private _camera : BABYLON.UniversalCamera;

	private _anchor : BABYLON.Vector3;
	private _target : BABYLON.Vector3;

	constructor(canvas : HTMLCanvasElement, scene : BABYLON.Scene) {
		super(SystemType.LAKITU);

		this._camera = new BABYLON.UniversalCamera("camera", Lakitu._offset, scene);
		this._camera.fov = Lakitu._horizontalFov;
    	this._camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;

    	this._anchor = BABYLON.Vector3.Zero();
    	this._target = BABYLON.Vector3.Zero();
	}

	camera() : BABYLON.UniversalCamera { return this._camera; }
	anchor() : BABYLON.Vector3 { return this._anchor; }
	target() : BABYLON.Vector3 { return this._target; }

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

	override setEntity(entity : Entity) {
		if (!entity.hasProfile()) {
			console.log("Error: target entity must have profile.");
			return;
		}
		super.setEntity(entity);
	}

	override postUpdate(millis : number) : void {
		super.postUpdate(millis);

		if (this.hasEntity()) {
			let target = BABYLON.Vector3.Zero();
			target.x = this.entity().profile().pos().x;
			target.y = this.entity().profile().pos().y;

			this.setAnchor(target);
		}
	}
}
