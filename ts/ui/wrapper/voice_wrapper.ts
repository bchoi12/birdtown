
import { game } from 'game'

import { ui } from 'ui'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class VoiceWrapper extends ButtonWrapper {

	constructor() {
		super();

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

	private updateHTML() : void {
		if (game.initialized() && game.netcode().voiceEnabled()) {
			this.setIcon(IconType.MIC);
			this.setText("[Proximity voice chat on]");
		} else {
			this.setIcon(IconType.MUTED_MIC);
			this.setText("[Proximity voice chat off]");
		}
	}
}