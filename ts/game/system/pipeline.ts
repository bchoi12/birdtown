import * as BABYLON from '@babylonjs/core/Legacy/legacy'

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
	private _fxaa : BABYLON.FxaaPostProcess;
	private _effects : Map<EffectType, BABYLON.PostProcessRenderEffect>;
	private _enabledEffects : Set<EffectType>;
	private _pipeline : BABYLON.PostProcessRenderPipeline;

	constructor(engine : BABYLON.WebGPUEngine, scene : BABYLON.Scene, camera : BABYLON.Camera) {
		super(SystemType.PIPELINE);

		// Note: do not define camera when constructing PostProcess to prevent it from auto-enabling
		this._postProcesses = new Map();
		// Don't set reusable to true: https://doc.babylonjs.com/setup/support/webGPU/webGPUOptimization/webGPUMiscellaneous#optimize-post-processes
		this._fxaa = new BABYLON.FxaaPostProcess(PostProcessType.FXAA, 1, null, undefined, engine, /*reusable=*/false);
		this._postProcesses.set(PostProcessType.FXAA, this._fxaa);

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

		let scene = game.scene();
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

		const samples = settings.fxaaSamples();
		if (samples <= 0) {
			this.setEffectEnabled(EffectType.ANTI_ALIAS, false);
		} else {
			this.setEffectEnabled(EffectType.ANTI_ALIAS, true);
			this._fxaa.samples = samples;
		}
	}
}