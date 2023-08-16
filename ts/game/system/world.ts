import * as BABYLON from 'babylonjs'

import { game } from 'game'	
import { ComponentType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity } from 'game/entity'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

enum LayerType {
	UNKNOWN,
	HIGHLIGHT,
}

export type HighlightParams = {
	enabled : boolean;
	color? : BABYLON.Color3;
}

export class World extends SystemBase implements System {

	private _scene : BABYLON.Scene;
	private _layers : Map<LayerType, BABYLON.EffectLayer>;

	private _hemisphericLight : BABYLON.HemisphericLight;
	private _directionalLight : BABYLON.DirectionalLight;

	constructor(engine : BABYLON.Engine) {
		super(SystemType.WORLD);

		this._scene = new BABYLON.Scene(engine);
		this._scene.useRightHandedSystem = true;

		this._layers = new Map();
		this._layers.set(LayerType.HIGHLIGHT, new BABYLON.HighlightLayer("highlight", this._scene, {
        	isStroke: true,
        	mainTextureRatio: 2,
		}));

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

	highlight(mesh : BABYLON.Mesh, params : HighlightParams) : void {
		let layer = this.getLayer<BABYLON.HighlightLayer>(LayerType.HIGHLIGHT);
		if (params.enabled) {
			let color = params.color ? params.color : BABYLON.Color3.Red();
			layer.addMesh(mesh, color);
		} else {
			layer.removeMesh(mesh);
		}
	}
	excludeHighlight(mesh : BABYLON.Mesh, excluded : boolean) : void {
		let layer = this.getLayer<BABYLON.HighlightLayer>(LayerType.HIGHLIGHT);
		if (excluded) {
			layer.addExcludedMesh(mesh)
		} else {
			layer.removeExcludedMesh(mesh);
		}
	}

	getLayer<T extends BABYLON.EffectLayer>(type : LayerType) : T { return <T>this._layers.get(type); }

	override render() : void {
		super.render();

		this._scene.render();
	}
}