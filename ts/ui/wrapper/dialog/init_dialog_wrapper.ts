
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'

import { settings } from 'settings'
import { FullscreenSetting } from 'settings/api'

import { DialogType } from 'ui/api'
import { LoginNames } from 'ui/common/login_names'
import { Html } from 'ui/html'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class InitDialogWrapper extends DialogWrapper {

	constructor() {
		super(DialogType.INIT);

		this.setTitle("Welcome to Birdtown");
		this.addNamePage();
	}

	private addNamePage() : void {
		let pageWrapper = this.addPage();

		let nameInput = Html.input();
		pageWrapper.elm().appendChild(nameInput);

		let groupIndex = pageWrapper.addButtonGroup();
		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "OK";
			buttonWrapper.addOnSelect(() => {
				const name = nameInput.value.length > 0 ? nameInput.value : LoginNames.randomName();
				this.dialogMessage().setDisplayName(name);

				if (settings.fullscreenSetting === FullscreenSetting.FULLSCREEN) {
					document.documentElement.requestFullscreen()
				}
				pageWrapper.submit();
			});
		}
	}
}