
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

export class DisconnectedDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Disconnected");
		this.shrink();

		let pageWrapper = this.addPage();
        pageWrapper.elm().textContent = `Lost connection with the host.`;

		let reconnect = new ButtonWrapper();
		reconnect.setIcon(IconType.CHECK_CIRCLE);
		reconnect.setText("Reconnect");
		reconnect.elm().style.float = "right";
		reconnect.setHoverColor(ColorFactory.toString(ColorType.UI_GREEN));

		reconnect.addOnClick(() => {
			const url = new URL(window.location.href);
			url.searchParams.set(UiGlobals.roomParam, game.netcode().room());
			window.location.replace(url.toString());
			this.nextPage();
		});

		this.footerElm().appendChild(reconnect.elm());

		let quit = new ButtonWrapper();
		quit.setIcon(IconType.CANCEL);
		quit.setText("Quit");
		quit.elm().style.float = "right";
		quit.setHoverColor(ColorFactory.toString(ColorType.UI_RED));

		quit.addOnClick(() => {
			window.location.replace(location.pathname);
			this.nextPage();
		});

		this.footerElm().appendChild(quit.elm());
	}
}