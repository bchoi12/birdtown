import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { settings } from 'settings'

export enum PostProcessType {
	UNKNOWN = "",
	FXAA = "fxaa",
}

export enum EffectType {
	UNKNOWN = "",
	ANTI_ALIAS = "anti-alias",
}

export class Pipeline extends SystemBase implements System {

	private static readonly _name = "pipeline";

	private _postProcesses : Map<PostProcessType, BABYLON.PostProcess>;
	private _effects : Map<EffectType, BABYLON.PostProcessRenderEffect>;
	private _enabledEffects : Set<EffectType>;
	private _pipeline : BABYLON.PostProcessRenderPipeline;

	constructor(engine : BABYLON.Engine, scene : BABYLON.Scene, camera : BABYLON.Camera) {
		super(SystemType.PIPELINE);

		// Note: do not define camera when constructing PostProcess to prevent it from auto-enabling.
		this._postProcesses = new Map();
		let fxaa = new BABYLON.FxaaPostProcess(PostProcessType.FXAA, 1, null, undefined, engine, /*reusable=*/true);
		// TODO: setting to modify?
		fxaa.samples = 8;
		this._postProcesses.set(PostProcessType.FXAA, fxaa);

		this._effects = new Map();
		let antiAlias = new BABYLON.PostProcessRenderEffect(engine, EffectType.ANTI_ALIAS, () => {
			return [this.getPostProcess(PostProcessType.FXAA)];
		});
		this._effects.set(EffectType.ANTI_ALIAS, antiAlias)
		this._enabledEffects = new Set([EffectType.ANTI_ALIAS]);

		this._pipeline = new BABYLON.PostProcessRenderPipeline(engine, Pipeline._name);
		this._pipeline.addEffect(this.getEffect(EffectType.ANTI_ALIAS));

		scene.postProcessRenderPipelineManager.addPipeline(this._pipeline);
	    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(Pipeline._name, camera);
	}

	getPostProcess<T extends BABYLON.PostProcess>(type : PostProcessType) : T {
		return <T>this._postProcesses.get(type);
	}

	getEffect<T extends BABYLON.PostProcessRenderEffect>(type : EffectType) : T {
		return <T>this._effects.get(type);
	}

	effectEnabled(type : EffectType) : boolean { return this._enabledEffects.has(type); }

	setEffectEnabled(effectType : EffectType, enabled : boolean) : void {
		if (!this._effects.has(effectType)) {
			return;
		}
		if (enabled === this.effectEnabled(effectType)) {
			return;
		}

		let scene = game.world().scene();
		let camera = game.lakitu().camera();
		if (enabled) {
			scene.postProcessRenderPipelineManager.enableEffectInPipeline(Pipeline._name, effectType, [camera]);
			this._enabledEffects.add(effectType);
			return;
		} 

		scene.postProcessRenderPipelineManager.disableEffectInPipeline(Pipeline._name, effectType, [camera]);
		this._enabledEffects.delete(effectType);
	}

	override preRender() : void {
		super.preRender();

		if (settings.enableAntiAlias !== this.effectEnabled(EffectType.ANTI_ALIAS)) {
			this.setEffectEnabled(EffectType.ANTI_ALIAS, settings.enableAntiAlias);
			console.log("Set %s to %s", EffectType.ANTI_ALIAS, settings.enableAntiAlias);
		}
	}
}