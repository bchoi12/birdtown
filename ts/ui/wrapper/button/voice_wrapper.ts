
import { game } from 'game'

import { ui } from 'ui'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class VoiceWrapper extends ButtonWrapper {

	private _enabledText : string;
	private _disabledText : string;

	constructor() {
		super();

		this._enabledText = "";
		this._disabledText = "";

		this.addOnClick(() => {
			const shouldEnable = !game.netcode().voiceEnabled();
			game.netcode().setVoiceEnabled(shouldEnable);
			this.updateHTML();
		});
		this.updateHTML();
	}

	handleVoiceError() : void {
		this.updateHTML();
	}

	setEnabledText(text : string) : void {
		this._enabledText = text;

		this.updateHTML();
	}
	setDisabledText(text : string) : void {
		this._disabledText = text;

		this.updateHTML();
	}

	private enabled() : boolean {
		return game.initialized() && game.netcode().voiceEnabled();
	}

	private updateHTML() : void {
		if (this.enabled()) {
			this.setIcon(IconType.MIC);
			this.setText(this._enabledText);
		} else {
			this.setIcon(IconType.MUTED_MIC);
			this.setText(this._disabledText)
		}
	}
}