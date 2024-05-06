
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { ColorFactory } from 'game/factory/color_factory'

import { settings } from 'settings'
import { FullscreenSetting } from 'settings/api'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { LoginNames } from 'ui/common/login_names'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class InitDialogWrapper extends ClientDialogWrapper {

	constructor() {
		super(DialogType.INIT);

		this.titleElm().textContent = "Welcome to Birdtown";
		this.addNamePage();
	}

	private addNamePage() : void {
		let pageWrapper = this.addPage();

		let nameInput = Html.input();
		nameInput.placeholder = "[Enter your name]";
		pageWrapper.elm().appendChild(nameInput);

		pageWrapper.elm().appendChild(Html.br());

		let colorInput = Html.input();
		colorInput.type = "color";
		colorInput.value = ColorFactory.playerColor(game.clientId()).toString();
		pageWrapper.elm().appendChild(colorInput);

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			const name = nameInput.value.length > 0 ? nameInput.value : LoginNames.randomName();
			this.dialogMessage().setDisplayName(name);
			this.dialogMessage().setColor(colorInput.value);
			this.nextPage();
		});

		this.addOnSubmit(() => {
			ui.applySettings();
		});
	}
}