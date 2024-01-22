
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'

import { DialogType } from 'ui/api'
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
		let groupIndex = pageWrapper.addButtonGroup();
		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "OK";
			buttonWrapper.setOnSelect(() => {
				this.dialogMessage().setDisplayName("Bob");
				pageWrapper.submit();
			});
		}
	}
}