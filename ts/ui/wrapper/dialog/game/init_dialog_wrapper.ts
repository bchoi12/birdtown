
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'

import { settings } from 'settings'
import { FullscreenSetting } from 'settings/api'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { LoginNames } from 'ui/common/login_names'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { GameDialogWrapper } from 'ui/wrapper/game_dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class InitDialogWrapper extends GameDialogWrapper {

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

		let colorInput = Html.input();
		colorInput.type = "color";
		pageWrapper.elm().appendChild(colorInput);

		let buttonWrapper = new ButtonWrapper();
		buttonWrapper.setText("OK");
		buttonWrapper.addOnClick(() => {
			const name = nameInput.value.length > 0 ? nameInput.value : LoginNames.randomName();
			this.dialogMessage().setDisplayName(name);
			this.dialogMessage().setColor(colorInput.value);
			this.nextPage();
		});
		this.footerElm().appendChild(buttonWrapper.elm());

		this.addOnSubmit(() => {
			ui.applySettings();
		});
	}
}