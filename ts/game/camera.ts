import * as BABYLON from "babylonjs";

import { game } from 'game'

export class Camera {

	private _camera : BABYLON.FreeCamera;

	constructor() {
		this._camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, -20), game.scene());
	    this._camera.setTarget(BABYLON.Vector3.Zero());
    	this._camera.attachControl(game.canvas(), true);
	}
}
