
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
		this.important();

		let pageWrapper = this.addPage();

		pageWrapper.elm().style.fontSize = "0.8em";
        pageWrapper.elm().innerHTML = `<span>We use your <strong>approximate</strong> location for:</span>`
    		+ `<ul><li>estimating server location when hosting public games</li><li>estimating the distance from you to any public games</li></ul>`
    		+ `<span>You <strong>do not</strong> need to share your location to play.</span>`;

		let okButton = this.addOKButton("Close");
		okButton.addOnClick(() => {
			this.nextPage();
		});
	}
}