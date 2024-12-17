import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { GradientMaterial } from '@babylonjs/materials/Gradient'

import { game } from 'game'	
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { GameData } from 'game/game_data'
import { ColorType, MaterialType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { CloudGenerator } from 'game/system/generator/cloud_generator'
import { System, SystemBase } from 'game/system'
import { SystemType, TimeType } from 'game/system/api'

import { Flags } from 'global/flags'

import { settings } from 'settings'
import { FilteringQuality, ShadowSetting } from 'settings/api'

enum LayerType {
	UNKNOWN,
	GLOW,
	HIGHLIGHT,
}

type TimeSettings = {
	skyMaterial : MaterialType;
	lightDir : BABYLON.Vector3;

	directionalIntensity : number;
	directionalDiffuse : BABYLON.Color3;

	hemisphericIntensity : number;
	hemisphericDiffuse : BABYLON.Color3;
	hemisphericBottomColor : BABYLON.Color3;
}

export type HighlightParams = {
	color : BABYLON.Color3;
}

export type GlowParams = {
	intensity : number;
}

export class World extends SystemBase implements System {

	private static readonly _greenSettings = {
		skyMaterial: MaterialType.GREEN_SCREEN,
		lightDir: new BABYLON.Vector3(1, -3, -4).normalize(),
		directionalIntensity: 1.3,
		directionalDiffuse: new BABYLON.Color3(1, 1, 1),
		hemisphericIntensity: 0.7,
		hemisphericDiffuse: new BABYLON.Color3(1, 1, 1),
		hemisphericBottomColor: new BABYLON.Color3(0.7, 0.7, 0.7),
	};

	private static readonly _timeSettings = new Map<TimeType, TimeSettings>([
		[TimeType.DAY, {
			skyMaterial: MaterialType.SKY_DAY,
			lightDir: new BABYLON.Vector3(1, -3, -4).normalize(),
			directionalIntensity: 1.3,
			directionalDiffuse: new BABYLON.Color3(1, 1, 1),
			hemisphericIntensity: 0.7,
			hemisphericDiffuse: new BABYLON.Color3(1, 1, 1),
			hemisphericBottomColor: new BABYLON.Color3(0.7, 0.7, 0.7),
		}],
		[TimeType.EVENING, {
			skyMaterial: MaterialType.SKY_EVENING,
			lightDir: new BABYLON.Vector3(2, -2, -6).normalize(),
			directionalIntensity: 1.8,
			directionalDiffuse: new BABYLON.Color3(1, 0.77, 0.55),
			hemisphericIntensity: 0.4,
			hemisphericDiffuse: new BABYLON.Color3(1, 0.88, 0.77),
			hemisphericBottomColor: new BABYLON.Color3(0.7, 0.58, 0.44),
		}],
		[TimeType.NIGHT, {
			skyMaterial: MaterialType.SKY_NIGHT,
			lightDir: new BABYLON.Vector3(-1, -4, 4).normalize(),
			directionalIntensity: 1.4,
			directionalDiffuse: new BABYLON.Color3(1, 1, 1),
			hemisphericIntensity: 0.8,
			hemisphericDiffuse: new BABYLON.Color3(1, 1, 1),
			hemisphericBottomColor: new BABYLON.Color3(0.1, 0.1, 0.1),
		}],
	]);

	private _scene : BABYLON.Scene;
	private _layers : Map<LayerType, BABYLON.EffectLayer>;

	private _currentTime : TimeType;
	private _desiredTime : TimeType;
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

		// Needed to allow mouse events (mousedown) during pointer lock on Firefox
		this._scene.preventDefaultOnPointerDown = false;
		this._scene.preventDefaultOnPointerUp = false;

		// Performance optimization
		this._scene.skipPointerMovePicking = true;

		this._layers = new Map();
		this._layers.set(LayerType.HIGHLIGHT, new BABYLON.HighlightLayer("highlight", this._scene, {
        	isStroke: true,
        	mainTextureRatio: 4,
		}));

		this._currentTime = TimeType.UNKNOWN;
		this._desiredTime = TimeType.UNKNOWN;

	    this._lightDir = new BABYLON.Vector3(1, -3, -4);
	    this._lightDir.normalize();
	    this._hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", this._lightDir.scale(-1), this._scene);
	    this._hemisphericLight.diffuse = new BABYLON.Color3(1, 1, 1);
	    this._hemisphericLight.specular = new BABYLON.Color3(1, 1, 1);
	    this._hemisphericLight.groundColor = new BABYLON.Color3(0.7, 0.7, 0.7);
	    this._hemisphericLight.intensity = 0.7;

	    this._directionalLight = new BABYLON.DirectionalLight("directionalLight", this._lightDir, this._scene);
	    this._directionalLight.diffuse = new BABYLON.Color3(1, 1, 1);
	    this._directionalLight.intensity = 1.3;
	    this._directionalLight.autoUpdateExtends = false;
	    this._directionalLight.autoCalcShadowZBounds = false;
		this._shadowGenerator = new BABYLON.ShadowGenerator(1024, this._directionalLight);

		this._skyBox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 200.0 }, this._scene);
		this._cloudGenerator = this.addSubSystem<CloudGenerator>(SystemType.CLOUD_GENERATOR, new CloudGenerator());

		this.addProp<TimeType>({
			has: () => { return this._desiredTime !== TimeType.UNKNOWN; },
			export: () => { return this._desiredTime; },
			import: (obj : TimeType) => { this.setTime(obj); },
			options: {
				filters: GameData.tcpFilters,
			},
		});
	}

	override initialize() : void {
		super.initialize();

		MaterialFactory.initialize();
		if (this.isSource()) {
			this.setTime(TimeType.DAY);
		}

		this._shadowGenerator.bias = 1.5e-3;
		this._shadowGenerator.transparencyShadow = true;

		this.refreshSettings();
	}

	incrementTime() : void {
		if (this._desiredTime === TimeType.NIGHT) {
			this.setTime(TimeType.DAY);
		} else {
			this.setTime(this._desiredTime + 1);
		}
	}
	setTime(type : TimeType) : void {
		if (!World._timeSettings.has(type)) {
			return;
		}
		if (this._desiredTime === type) {
			return;
		}
		this._desiredTime = type;
	}
	applyTime(type : TimeType) : void {
		if (this._currentTime === type) {
			return;
		}

		const settings = World._timeSettings.get(type);
		this.applySettings(settings);

	    this._currentTime = type;
	}
	greenScreen() : void {
		game.entities().getMap(EntityType.BACKGROUND_ARCH_ROOM).execute((entity : Entity) => {
			entity.delete();
		});
		game.entities().getMap(EntityType.CLOUD).execute((entity : Entity) => {
			entity.delete();
		});
		game.entities().findEntities((entity : Entity) => {
			return entity.allTypes().has(EntityType.BLOCK);
		}).forEach((entity : Entity) => {
			if (entity.hasModel()) {
				entity.model().setVisible(false);
			}
		});

		this.applySettings(World._greenSettings);
	}
	private applySettings(settings : TimeSettings) : void {
		this._skyBox.material = MaterialFactory.material(settings.skyMaterial);
		this._directionalLight.direction.copyFrom(settings.lightDir);
		this._directionalLight.intensity = settings.directionalIntensity;
		this._directionalLight.diffuse = settings.directionalDiffuse;
		this._hemisphericLight.intensity = settings.hemisphericIntensity;
	    this._hemisphericLight.diffuse = settings.hemisphericDiffuse;
	    this._hemisphericLight.groundColor = settings.hemisphericBottomColor;
	}

	renderShadows(mesh : BABYLON.AbstractMesh) : void {
		if (Flags.disableShadows.get()) {
			return;
		}

		this._shadowGenerator.addShadowCaster(mesh, true);
		mesh.receiveShadows = true;
		mesh.getChildMeshes().forEach((child : BABYLON.AbstractMesh) => {
			child.receiveShadows = true;
		});
	}
	removeShadows(mesh : BABYLON.AbstractMesh) : void {
		this._shadowGenerator.addShadowCaster(mesh, false);
		mesh.receiveShadows = false;
		mesh.getChildMeshes().forEach((child : BABYLON.AbstractMesh) => {
			child.receiveShadows = false;
		});
	}

	refreshSettings() : void {
		this.setShadowEnabled(settings.shadowSetting);
		this.setFilteringQuality(settings.shadowFiltering);
	}
	private setShadowEnabled(setting : ShadowSetting) : void {
		switch (setting) {
		case ShadowSetting.ON:
			this._directionalLight.shadowEnabled = true;
			break;
		default:
			this._directionalLight.shadowEnabled = false;
		}
	}
	private setFilteringQuality(setting : FilteringQuality) : void {
		if (setting !== FilteringQuality.NONE) {
			this._shadowGenerator.usePercentageCloserFiltering = true;

			switch (setting) {
			case FilteringQuality.LOW:
				this._shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;
				break;
			case FilteringQuality.MEDIUM:
				this._shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_MEDIUM;
				break;
			case FilteringQuality.HIGH:
				this._shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
				break;
			}
		} else {
			this._shadowGenerator.usePercentageCloserFiltering = false;
		}
	}

	scene() : BABYLON.Scene { return this._scene; }

	multiPick(ray : BABYLON.Ray) : Entity[] {
		if (this._scene.skipPointerMovePicking) {
			console.error("Warning: pointer move picking is disabled");
		}

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
		layer.addMesh(mesh, params.color);
	}
	removeHighlight(mesh : BABYLON.Mesh) : void {
		let layer = this.getLayer<BABYLON.HighlightLayer>(LayerType.HIGHLIGHT);
		layer.removeMesh(mesh);
	}
	excludeHighlight(mesh : BABYLON.Mesh) : void {
		let layer = this.getLayer<BABYLON.HighlightLayer>(LayerType.HIGHLIGHT);
		layer.addExcludedMesh(mesh)
	}

	glow(mesh : BABYLON.Mesh, params : GlowParams) : void {
		if (!this.hasLayer(LayerType.GLOW)) {
			let glow = new BABYLON.GlowLayer("glow", this._scene, {
				blurKernelSize: 64,
			});
			this._layers.set(LayerType.GLOW, glow);
		}

		let glow = this.getLayer<BABYLON.GlowLayer>(LayerType.GLOW);
		glow.intensity = 1;
		glow.setEffectIntensity(mesh, params.intensity);
		glow.addIncludedOnlyMesh(mesh);
	}
	removeGlow(mesh : BABYLON.Mesh) : void {
		if (!this.hasLayer(LayerType.GLOW)) {
			console.error("Warning: removeGlow() called but no GlowLayer exists");
			return;
		}

		let glow = this.getLayer<BABYLON.GlowLayer>(LayerType.GLOW);
		glow.removeIncludedOnlyMesh(mesh);
	}

	hasLayer(type : LayerType) : boolean { return this._layers.has(type); }
	getLayer<T extends BABYLON.EffectLayer>(type : LayerType) : T { return <T>this._layers.get(type); }

	override preRender() : void {
		super.preRender();

		if (this._currentTime !== this._desiredTime) {
			this.applyTime(this._desiredTime);
		}

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