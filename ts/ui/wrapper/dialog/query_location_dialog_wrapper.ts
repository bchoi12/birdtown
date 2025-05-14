
import { game } from 'game'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class QueryLocationDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Allow Location?");
		this.shrink();

		let pageWrapper = this.addPage();

        pageWrapper.elm().innerHTML = `<span>We use your <strong>approximate</strong> location for the following:</span>`
    		+ `<ul><li>determining server location when hosting public games</li><li>determining the distance from you to any publicly hosted games</li><ul>`
    		+ `<span>You <strong>do not</strong> need to share your location to play Birdtown</span>`;

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});
	}
}