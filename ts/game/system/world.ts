import * as BABYLON from 'babylonjs'

import { game } from 'game'	
import { System, SystemBase, SystemType } from 'game/system'

export class World extends SystemBase implements System {

	private _scene : BABYLON.Scene;

	constructor(engine : BABYLON.Engine) {
		super(SystemType.WORLD);

		this._scene = new BABYLON.Scene(engine);
		this._scene.useRightHandedSystem = true;

	    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);
	}

	scene() : BABYLON.Scene { return this._scene; }

	override render() : void {
		super.render();

		this._scene.render();
	}
}
		