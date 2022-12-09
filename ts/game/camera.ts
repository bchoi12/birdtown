import * as BABYLON from "babylonjs";

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

// TODO: camera modes
enum Mode {
	UNKNOWN,
}

export class Camera {
	// Horizontal length = 25 units
	private static readonly _horizontalFov = 45.2397 * Math.PI / 180;
	private static readonly _yMin = 1;
	private static readonly _offset = new BABYLON.Vector3(0, 3.0, 30.0);
	private static readonly _lookAtOffset = new BABYLON.Vector3(0, 0.5, 0);

	private _camera : BABYLON.UniversalCamera;

	private _entity : Entity;
	private _anchor : BABYLON.Vector3;
	private _target : BABYLON.Vector3;

	constructor() {
		this._camera = new BABYLON.UniversalCamera("camera", Camera._offset, game.scene());
		this._camera.fov = Camera._horizontalFov;
    	this._camera.fovMode = BABYLON.Camera.FOVMODE_HORIZONTAL_FIXED;

    	this._entity = null;
    	this._anchor = BABYLON.Vector3.Zero();
    	this._target = BABYLON.Vector3.Zero();
	}

	anchor() : BABYLON.Vector3 { return this._anchor; }
	target() : BABYLON.Vector3 { return this._target; }

	setEntity(entity : Entity) {
		if (!entity.has(ComponentType.PROFILE)) {
			console.log("Error: target entity must have profile.");
			return;
		}
		this._entity = entity;
	}

	setAnchor(anchor : BABYLON.Vector3) {
		this._anchor = anchor.clone();

		this._target = this._anchor.clone();
		this._target.add(Camera._lookAtOffset);
		this._target.y = Math.max(Camera._yMin, this._target.y);

		this._camera.position.x = this._target.x;
		this._camera.position.y = this._target.y;
		this._camera.position.y = Math.max(Camera._yMin + Camera._offset.y, this._camera.position.y);
		this._camera.setTarget(this._target);
	}

	update() : void {
		if (defined(this._entity)) {
			let target = BABYLON.Vector3.Zero();
			target.x = this._entity.profile().pos().x;
			target.y = this._entity.profile().pos().y;

			this.setAnchor(target);
		}
	}
}
