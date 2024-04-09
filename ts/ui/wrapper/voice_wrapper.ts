
import { game } from 'game'

import { MediaGlobals } from 'global/media_globals'

import { UiMessage } from 'message/ui_message'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

import { defined } from 'util/common'
import { Vec } from 'util/vector'

export class VoiceWrapper extends HtmlWrapper<HTMLElement> {

	private _micButton : HTMLElement;
	private _audioControls : Array<HTMLElement>;

	private _stream : MediaStream;
	private _panner : PannerNode;

	constructor(self : boolean) {
		super(Html.span());

		if (self) {
			this._micButton = Html.span();
			this._micButton.append(Icon.create(IconType.MUTED_MIC));
			this._micButton.classList.add(Html.classButton);

			this.elm().onclick = (e) => {
				e.stopPropagation();

				const enabled = game.netcode().toggleVoice();
				while(this._micButton.firstChild) {
					this._micButton.removeChild(this._micButton.firstChild);
				}

				if (enabled) {
					this._micButton.append(Icon.create(IconType.MIC));
				} else {
					this._micButton.append(Icon.create(IconType.MUTED_MIC));
				}
			};
			this.elm().append(this._micButton);
		}

		this._audioControls = new Array<HTMLElement>();
	}

	updatePos(pos : Vec) : void {
		if (!defined(this._panner)) {
			return;
		}

		const context = ui.audioContext();
		this._panner.positionX.setValueAtTime(pos.x, context.currentTime);
		this._panner.positionY.setValueAtTime(pos.y, context.currentTime);

		if (defined(pos.z)) {
			this._panner.positionZ.setValueAtTime(pos.z, context.currentTime);
		}
	}

	enable(stream : MediaStream) : void {
		if (this._audioControls.length > 0) {
			return;
		}

		this._stream = stream;

		// Create fakeAudio as workaround for Chrome bug where stream is not audible in AudioContext
		let fakeStream = new MediaStream();

		// TODO: check if this is needed?
		let fakeAudio = new Audio();
		fakeAudio.srcObject = this._stream;
		fakeAudio.muted = true;

		let context = ui.audioContext();
		let source = context.createMediaStreamSource(this._stream);
		let dest = context.createMediaStreamDestination();
		this._panner = new PannerNode(context, MediaGlobals.spatialVoiceOptions);

		source.connect(this._panner);
		this._panner.connect(dest);

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
				volumeRange.style.display = "block";
			}
		}
		muteButton.elm().classList.add(Html.classButton);

		this._audioControls.push(muteButton.elm());
		this._audioControls.push(volumeRange);
		this.elm().append(muteButton.elm());
		this.elm().append(volumeRange);
	}

	disable() : void {
		if (defined(this._stream)) {
			this._stream.getTracks().forEach(track => track.stop());
		}
		this._audioControls.forEach((elm) => {
			this.elm().removeChild(elm);
		});
		this._audioControls.length = 0;
	}
}