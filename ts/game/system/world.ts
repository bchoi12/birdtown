import * as BABYLON from 'babylonjs'

import { game } from 'game'	
import { System, SystemBase, SystemType } from 'game/system'

export class World extends SystemBase implements System {

	private _scene : BABYLON.Scene;

	private _hemisphericLight : BABYLON.HemisphericLight;
	private _directionalLight : BABYLON.DirectionalLight;

	constructor(engine : BABYLON.Engine) {
		super(SystemType.WORLD);

		this._scene = new BABYLON.Scene(engine);
		this._scene.useRightHandedSystem = true;

	    this._hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), this._scene);
	    this._hemisphericLight.diffuse = new BABYLON.Color3(0.8, 0.8, 0.8);
	    this._hemisphericLight.specular = new BABYLON.Color3(1, 1, 1);
	    this._hemisphericLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);
	    this._hemisphericLight.intensity = 0.6;

	    this._directionalLight = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(1, -1, -1), this._scene);
	    this._directionalLight.diffuse = new BABYLON.Color3(1, 1, 1);
	    this._directionalLight.intensity = 0.8;

		let shadowGenerator = new BABYLON.ShadowGenerator(1024, this._directionalLight);
		shadowGenerator.useExponentialShadowMap = true;

	}

	scene() : BABYLON.Scene { return this._scene; }

	override render(millis : number) : void {
		super.render(millis);

		this._scene.render();
	}
}