import * as BABYLON from '@babylonjs/core/Legacy/legacy'

export namespace MediaGlobals {

	export const panningModel = "HRTF";
	export const distanceModel = "inverse";
	export const refDistance = 4;
	export const maxDistance = 30;
	export const rolloffFactor = 1;

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

	export const mediaConstraints : MediaStreamConstraints = {
		audio: {
			autoGainControl: true,
			echoCancellation: true,
			noiseSuppression: true,
		},
	    video: false,
    };
}