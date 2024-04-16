
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'

import { settings } from 'settings'
import { FullscreenSetting } from 'settings/api'

import { DialogType } from 'ui/api'
import { LoginNames } from 'ui/common/login_names'
import { Html } from 'ui/html'
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

		let buttonWrapper = pageWrapper.addButton();
		buttonWrapper.setText("OK");
		buttonWrapper.addOnClick(() => {
			const name = nameInput.value.length > 0 ? nameInput.value : LoginNames.randomName();
			this.dialogMessage().setDisplayName(name);

			if (settings.fullscreenSetting === FullscreenSetting.FULLSCREEN) {
				document.documentElement.requestFullscreen()
			}
			pageWrapper.submit();
		});
	}
}