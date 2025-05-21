
import { game } from 'game'
import { ColorType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class FailedConnectDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Failed to Connect");
		this.shrink();

		let pageWrapper = this.addPage();
        pageWrapper.elm().innerHTML = `<span>Failed to connect to the host. This could be because</span><ul><li>the game is full</li><li>your password is incorrect</li><li>the host ended the game suddenly</li><li>you were banned</li><ul>`;

		let quit = new ButtonWrapper();
		quit.setIcon(IconType.CANCEL);
		quit.setText("Go Back");
		quit.elm().style.float = "right";
		quit.setHoverColor(ColorFactory.toString(ColorType.UI_RED));

		quit.addOnClick(() => {
			window.location.replace(location.pathname);
			this.nextPage();
		});

		this.footerElm().appendChild(quit.elm());
	}
}