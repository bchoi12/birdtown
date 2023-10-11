import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { SkyMaterial } from '@babylonjs/materials/Sky'

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
	private _directionalLightOffset : BABYLON.Vector3;
	private _shadowGenerator : BABYLON.ShadowGenerator;

	private _skyBox : BABYLON.Mesh;

	constructor(engine : BABYLON.Engine) {
		super(SystemType.WORLD);

		this._scene = new BABYLON.Scene(engine);
		this._scene.useRightHandedSystem = true;
		this._scene.disablePhysicsEngine();

		this._layers = new Map();
		this._layers.set(LayerType.HIGHLIGHT, new BABYLON.HighlightLayer("highlight", this._scene, {
        	isStroke: true,
        	mainTextureRatio: 2,
		}));

	    const dir = new BABYLON.Vector3(-0.1, -0.3, -0.4);
	    this._hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", dir.scale(-1), this._scene);
	    this._hemisphericLight.diffuse = new BABYLON.Color3(0.8, 0.8, 0.8);
	    this._hemisphericLight.specular = new BABYLON.Color3(1, 1, 1);
	    this._hemisphericLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);
	    this._hemisphericLight.intensity = 0.6;

	    this._directionalLight = new BABYLON.DirectionalLight("directionalLight", dir, this._scene);
	    this._directionalLightOffset = dir.scale(-50);
	    this._directionalLight.position = this._directionalLightOffset;
	    this._directionalLight.diffuse = new BABYLON.Color3(1, 1, 1);
	    this._directionalLight.intensity = 1.0;

		this._shadowGenerator = new BABYLON.ShadowGenerator(1024, this._directionalLight);
		this._shadowGenerator.transparencyShadow = true;
		this._shadowGenerator.usePercentageCloserFiltering = true;
		// TODO: option for shadow quality
		this._shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;

		this._skyBox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 500.0 }, this._scene);
		this._skyBox.position.y = -100;
		let skyMaterial = new SkyMaterial("skyMaterial", this._scene);
		skyMaterial.backFaceCulling = false;
		skyMaterial.inclination = 0;
		skyMaterial.luminance = 1.0;
		skyMaterial.turbidity = 5;
		this._skyBox.material = skyMaterial;
	}

	renderShadows(mesh : BABYLON.AbstractMesh) : void {
		this._shadowGenerator.addShadowCaster(mesh, true);
		mesh.receiveShadows = true;
		mesh.getChildMeshes().forEach((child : BABYLON.AbstractMesh) => {
			child.receiveShadows = true;
		});
	}

	scene() : BABYLON.Scene { return this._scene; }

	multiPick(ray : BABYLON.Ray) : Entity[] {
		let entities = [];

		const results = this._scene.multiPickWithRay(ray);
		for (let result of results) {
			if (result.hit && result.pickedMesh.metadata && result.pickedMesh.metadata.entityId) {
				let [entity, found] = game.entities().getEntity(result.pickedMesh.metadata.entityId);

				if (!found) { continue; }

				entities.push(entity);
			}
		}
		return entities;
	}

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

	override preRender() : void {
		super.preRender();

		this._directionalLight.position.copyFrom(game.lakitu().camera().position);
		this._directionalLight.position.addInPlace(this._directionalLightOffset);
		this._skyBox.position.x = game.lakitu().camera().position.x;
	}

	override render() : void {
		super.render();

		this._scene.render();
	}
}