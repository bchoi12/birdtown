import * as BABYLON from '@babylonjs/core/Legacy/legacy'

export namespace MediaGlobals {

	export const panningModel = "equalpower";
	export const distanceModel = "linear";
	export const refDistance = 8;
	export const maxDistance = 40;
	export const rolloffFactor = 2.2;

	export const gameOptions : BABYLON.ISoundOptions = {
	    distanceModel: distanceModel,
	    refDistance: refDistance,
	    maxDistance: maxDistance,
	    rolloffFactor: rolloffFactor,
	    spatialSound: false,
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