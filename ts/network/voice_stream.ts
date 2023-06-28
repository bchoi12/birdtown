
import { Vec } from 'util/vector'

export class VoiceStream {
	
	private _source : MediaStreamAudioSourceNode;
	private _panner : PannerNode;
	private _destination : MediaStreamAudioDestinationNode;

	constructor(stream : MediaStream, audioContext : AudioContext) {
		this._source = audioContext.createMediaStreamSource(stream);
		this._panner = new PannerNode(audioContext, {
		    panningModel: "HRTF",
		    distanceModel: "inverse",
		    refDistance: 1,
		    maxDistance: 10000,
		    rolloffFactor: 1,
		    coneInnerAngle: 360,
		    coneOuterAngle: 0,
		    coneOuterGain: 0,
		    orientationX: 1,
		    orientationY: 0,
		    orientationZ: 0,
		});
		this._destination = audioContext.createMediaStreamDestination();

		this._source.connect(this._panner);
		this._panner.connect(this._destination);
	}

	setSoundPosition(vec : Vec) : void {
		this._panner.positionX.value = vec.x;
		this._panner.positionY.value = vec.y;
	}

	stream() : MediaStream { return this._destination.stream; }
}