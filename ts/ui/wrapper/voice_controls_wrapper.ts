
import { game } from 'game'

import { MediaGlobals } from 'global/media_globals'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

import { defined } from 'util/common'
import { Optional } from 'util/optional'
import { Vec } from 'util/vector'

export class VoiceControlsWrapper extends HtmlWrapper<HTMLElement> {

	private _audioControls : Array<HTMLElement>;

	private _stream : Optional<MediaStream>;
	private _panner : Optional<PannerNode>;

	constructor() {
		super(Html.span());

		this._audioControls = new Array<HTMLElement>();

		this._stream = new Optional();
		this._panner = new Optional();
	}

	updatePos(pos : Vec) : void {
		if (!ui.hasAudio() || !this._panner.has()) {
			return;
		}

		const context = ui.audioContext();
		this._panner.get().positionX.setValueAtTime(pos.x, context.currentTime);
		this._panner.get().positionY.setValueAtTime(pos.y, context.currentTime);
		this._panner.get().positionZ.setValueAtTime(pos.z, context.currentTime);
	}

	enable(stream : MediaStream) : void {
		if (this._audioControls.length > 0) {
			return;
		}

		this._stream.set(stream);

		// Create fakeAudio as workaround for Chrome bug where stream is not audible in AudioContext
		let fakeStream = new MediaStream();

		// TODO: check if this is needed?
		let fakeAudio = new Audio();
		fakeAudio.srcObject = this._stream.get();
		fakeAudio.muted = true;

		let context = ui.audioContext();
		let source = context.createMediaStreamSource(this._stream.get());
		let dest = context.createMediaStreamDestination();
		this._panner.set(new PannerNode(context, MediaGlobals.spatialVoiceOptions));

		source.connect(this._panner.get());
		this._panner.get().connect(dest);

		let audio = Html.audio();
		audio.srcObject = dest.stream;
		audio.style.display = "none";
		audio.play();

		let volumeRange = Html.range();
		volumeRange.min = "0";
		volumeRange.max = "100";
		volumeRange.value = "" + audio.volume * 100;
		volumeRange.onchange = () => {
			audio.volume = Number(volumeRange.value) / 100;
		};

		let muteButton = new HtmlWrapper(Html.span());
		if (audio.muted) {
			muteButton.elm().append(Icon.create(IconType.VOLUME_X));
		} else {
			muteButton.elm().append(Icon.create(IconType.VOLUME_HIGH));
		}
		muteButton.elm().onclick = (e) => {
			audio.muted = !audio.muted;

			muteButton.removeChildren();
			if (audio.muted) {
				muteButton.elm().append(Icon.create(IconType.VOLUME_X));
				volumeRange.style.display = "none";
			} else {
				muteButton.elm().append(Icon.create(IconType.VOLUME_HIGH));
				volumeRange.style.display = "inline";
			}
		}
		muteButton.elm().classList.add(Html.classButton);

		this._audioControls.push(muteButton.elm());
		this._audioControls.push(volumeRange);
		this.elm().append(muteButton.elm());
		this.elm().append(volumeRange);
	}

	disable() : void {
		if (this._stream.has()) {
			this._stream.get().getTracks().forEach(track => track.stop());
		}
		this._audioControls.forEach((elm) => {
			this.elm().removeChild(elm);
		});
		this._audioControls.length = 0;
	}
}