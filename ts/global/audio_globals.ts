import * as BABYLON from 'babylonjs'

export namespace AudioGlobals {

	export const panningModel = "HRTF";
	export const distanceModel = "inverse";
	export const refDistance = 3;
	export const maxDistance = 30;
	export const rolloffFactor = 1.5;

	export const spatialGameOptions : BABYLON.ISoundOptions = {
	    distanceModel: distanceModel,
	    refDistance: refDistance,
	    maxDistance: maxDistance,
	    rolloffFactor: rolloffFactor,
	    spatialSound: true,
	};

	export const spatialVoiceOptions : PannerOptions = {
	    panningModel: panningModel,
	    distanceModel: distanceModel,
	    refDistance: refDistance,
	    maxDistance: maxDistance,
	    rolloffFactor: rolloffFactor,
	    coneInnerAngle: 360,
	    coneOuterAngle: 0,
	    coneOuterGain: 0,
	};
}