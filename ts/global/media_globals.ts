import * as BABYLON from '@babylonjs/core/Legacy/legacy'

export namespace MediaGlobals {

	const panningModel = "equalpower";
	const distanceModel = "linear";
	const refDistance = 6;
	const maxDistance = 30;
	const rolloffFactor = 2.2;

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