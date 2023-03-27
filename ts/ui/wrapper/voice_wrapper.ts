
import { ui } from 'ui'
import { NewClientMsg } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon } from 'ui/util/icon'

export class VoiceWrapper extends HtmlWrapper {

	private _micButton : HTMLElement;
	private _audioControls : Array<HTMLElement>;

	constructor(msg : NewClientMsg) {
		super(Html.span());

		if (msg.isSelf) {
			this._micButton = Html.span();
			this._micButton.append(Icon.mutedMicrophone());
			this._micButton.classList.add(Html.classTextButton);

			this.elm().onclick = (e) => {
				e.stopPropagation();

				// TODO: toggle
				ui.setVoiceEnabled(true);
				while(this._micButton.firstChild) {
					this._micButton.removeChild(this._micButton.firstChild);
				}
				this._micButton.append(Icon.microphone());

				/*
				if (ui.voiceEnabled()) {
					this._micButton.append(Icon.microphone());
				} else {
					this._micButton.append(Icon.mutedMicrophone());
				}
				*/
			};
			this.elm().append(this._micButton);
		}

		this._audioControls = new Array<HTMLElement>();
	}

	enable(stream : MediaStream) : void {
		if (this._audioControls.length > 0) {
			return;
		}

		let audio = Html.audio();
		audio.autoplay = true;
		audio.srcObject = stream;
		audio.style.display = "none";

		let volumeRange = Html.range();
		volumeRange.min = "0";
		volumeRange.max = "100";
		volumeRange.value = "" + audio.volume * 100;
		volumeRange.onchange = () => {
			audio.volume = Number(volumeRange.value) / 100;
		};

		let muteButton = new HtmlWrapper(Html.span());
		if (audio.muted) {
			muteButton.elm().append(Icon.volumeX());
		} else {
			muteButton.elm().append(Icon.volumeHigh());
		}
		muteButton.elm().onclick = (e) => {
			audio.muted = !audio.muted;

			muteButton.removeChildren();
			if (audio.muted) {
				muteButton.elm().append(Icon.volumeX());
				volumeRange.style.visibility = "hidden";
			} else {
				muteButton.elm().append(Icon.volumeHigh());
				volumeRange.style.visibility = "visible";
			}
		}
		muteButton.elm().classList.add(Html.classTextButton);

		this._audioControls.push(audio);
		this._audioControls.push(muteButton.elm());
		this._audioControls.push(volumeRange);
		this.elm().append(audio);
		this.elm().append(muteButton.elm());
		this.elm().append(volumeRange);
	}

	disable() : void {
		this._audioControls.forEach((elm) => {
			this.elm().removeChild(elm);
		});
		this._audioControls.length = 0;
	}
}