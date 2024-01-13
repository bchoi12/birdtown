import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { SkyMaterial } from '@babylonjs/materials/Sky'

import { game } from 'game'	
import { Entity } from 'game/entity'
import { MaterialFactory } from 'game/factory/material_factory'
import { CloudGenerator } from 'game/system/generator/cloud_generator'
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

	private _lightDir : BABYLON.Vector3;
	private _hemisphericLight : BABYLON.HemisphericLight;
	private _directionalLight : BABYLON.DirectionalLight;
	private _directionalLightOffset : BABYLON.Vector3;
	private _shadowGenerator : BABYLON.ShadowGenerator;
	private _skyBox : BABYLON.Mesh;

	private _cloudGenerator : CloudGenerator;

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

	    this._lightDir = new BABYLON.Vector3(-1, -3, -4);
	    this._lightDir.normalize();
	    this._hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", this._lightDir.scale(-1), this._scene);
	    this._hemisphericLight.diffuse = new BABYLON.Color3(0.8, 0.8, 0.8);
	    this._hemisphericLight.specular = new BABYLON.Color3(1, 1, 1);
	    this._hemisphericLight.groundColor = new BABYLON.Color3(0.3, 0.3, 0.3);
	    this._hemisphericLight.intensity = 0.6;

	    this._directionalLight = new BABYLON.DirectionalLight("directionalLight", this._lightDir, this._scene);
	    this._directionalLight.diffuse = new BABYLON.Color3(1, 1, 1);
	    this._directionalLight.intensity = 0.9;
	    this._directionalLight.autoUpdateExtends = false;
	    this._directionalLight.autoCalcShadowZBounds = false;
		this._shadowGenerator = new BABYLON.ShadowGenerator(1024, this._directionalLight, /*useFullFloatFirst=*/true);

		this._skyBox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 500.0 }, this._scene);
		this._skyBox.position.y = -100;
		let skyMaterial = new SkyMaterial("skyMaterial", this._scene);
		skyMaterial.backFaceCulling = false;
		skyMaterial.inclination = 0;
		skyMaterial.luminance = 1.0;
		skyMaterial.turbidity = 5;
		this._skyBox.material = skyMaterial;

		this._cloudGenerator = this.addSubSystem<CloudGenerator>(SystemType.CLOUD_GENERATOR, new CloudGenerator());
	}

	override initialize() : void {
		super.initialize();

		MaterialFactory.initialize();

		this._shadowGenerator.bias = 1.5e-3;
		this._shadowGenerator.transparencyShadow = true;

		// TODO: option for shadow quality
		this._shadowGenerator.usePercentageCloserFiltering = true;
		// TODO: option for shadow quality
		this._shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;
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

		const dist = game.lakitu().camera().position.subtract(game.lakitu().target()).length();
		this._directionalLight.shadowMinZ = 0;
	    this._directionalLight.shadowMaxZ = Math.abs(2 * dist);

		const buffer = 0.8;
		const fov = game.lakitu().fov();
	    this._directionalLight.orthoLeft = -buffer * fov.x;
	    this._directionalLight.orthoRight = buffer * fov.x;
	    this._directionalLight.orthoTop = buffer * fov.y;
	    this._directionalLight.orthoBottom = -buffer * fov.y;

		this._directionalLight.position.copyFrom(game.lakitu().target());
		this._directionalLight.position.addInPlace(this._directionalLight.direction.scale(-dist));

		this._skyBox.position.x = game.lakitu().camera().position.x;
	}

	override render() : void {
		super.render();

		this._scene.render();
	}
}