
import { game } from 'game'
import { ColorType } from 'game/factory/api'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class FailedCopyDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Invite Link");
		this.shrink();

		let pageWrapper = this.addPage();
        pageWrapper.elm().textContent = `Failed to automatically copy the invite link to clipboard, but you can copy it here:\r\n\r\n` +
        								`${ui.getInviteLink()}`;

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});

		this.footerElm().appendChild(okButton.elm());
	}
}