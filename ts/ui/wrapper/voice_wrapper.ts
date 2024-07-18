
import { game } from 'game'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

import { Vec } from 'util/vector'

export class VoiceWrapper extends HtmlWrapper<HTMLElement> {

	private _audioControls : Array<HTMLElement>;

	private _openMic : HTMLElement;
	private _mutedMic : HTMLElement;
	private _text : HTMLElement;

	constructor() {
		super(Html.div());
		this.elm().classList.add(Html.classButton);

		this._audioControls = new Array<HTMLElement>();

		this._openMic = Icon.create(IconType.MIC);
		this._openMic.classList.add(Html.classSpaced);
		this._mutedMic = Icon.create(IconType.MUTED_MIC);
		this._mutedMic.classList.add(Html.classSpaced);
		this._text = Html.span();

		this.updateHTML();

		this.elm().appendChild(this._openMic);
		this.elm().appendChild(this._mutedMic);
		this.elm().appendChild(this._text);

		this.elm().onclick = (e) => {
			e.stopPropagation();

			const shouldEnable = !game.netcode().voiceEnabled();
			game.netcode().setVoiceEnabled(shouldEnable);
			this.updateHTML();
		};
	}

	private updateHTML() : void {
		if (game.initialized() && game.netcode().voiceEnabled()) {
			this._openMic.style.display = "inline";
			this._mutedMic.style.display = "none";
			this._text.textContent = "[Voice chat on]"
		} else {
			this._openMic.style.display = "none";
			this._mutedMic.style.display = "inline";
			this._text.textContent = "[Voice chat off]"
		}
	}

	handleVoiceError() : void {
		this.updateHTML();
	}
}