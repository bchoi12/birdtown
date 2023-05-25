
import { game } from 'game'

import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/util/icon'

import { defined } from 'util/common'

export class VoiceWrapper extends HtmlWrapper {

	private _micButton : HTMLElement;
	private _audioControls : Array<HTMLElement>;

	private _stream : MediaStream;

	constructor(msg : UiMessage) {
		super(Html.span());

		if (msg.getProp<number>(UiProp.CLIENT_ID) === game.clientId()) {
			this._micButton = Html.span();
			this._micButton.append(Icon.create(IconType.MUTED_MIC));
			this._micButton.classList.add(Html.classTextButton);

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

	enable(stream : MediaStream) : void {
		if (this._audioControls.length > 0) {
			return;
		}

		this._stream = stream;
      	this._stream.getTracks().forEach((track) => { track.enabled = true; });

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
			muteButton.elm().append(Icon.create(IconType.VOLUME_X));
		} else {
			muteButton.elm().append(Icon.create(IconType.VOLUME_HIGH));
		}
		muteButton.elm().onclick = (e) => {
			audio.muted = !audio.muted;

			muteButton.removeChildren();
			if (audio.muted) {
				muteButton.elm().append(Icon.create(IconType.VOLUME_X));
				volumeRange.style.visibility = "hidden";
			} else {
				muteButton.elm().append(Icon.create(IconType.VOLUME_HIGH));
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
		if (defined(this._stream)) {
			this._stream.getTracks().forEach(track => track.stop());
		}
		this._audioControls.forEach((elm) => {
			this.elm().removeChild(elm);
		});
		this._audioControls.length = 0;
	}
}