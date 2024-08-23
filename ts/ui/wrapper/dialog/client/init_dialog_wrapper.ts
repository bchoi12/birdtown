
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { ColorFactory } from 'game/factory/color_factory'

import { settings } from 'settings'
import { FullscreenSetting } from 'settings/api'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ClientNameWrapper } from 'ui/wrapper/client_name_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class InitDialogWrapper extends ClientDialogWrapper {

	constructor() {
		super(DialogType.INIT);

		this.setTitle("Welcome to Birdtown");
		this.addNamePage();

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});

		this.addOnSubmit(() => {
			ui.applySettings();
			ui.onPlayerInitialized();
		});
	}

	private addNamePage() : void {
		let pageWrapper = this.addPage();

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);
		pageWrapper.elm().appendChild(columnsWrapper.elm());

		let bio = columnsWrapper.column(0);
		bio.setLegend("Bio");
		let nameWrapper = new ClientNameWrapper();
		bio.contentElm().appendChild(nameWrapper.elm());

		let bird = columnsWrapper.column(1);
		bird.setLegend("Bird");

		bird.contentElm().textContent = "TODO"

		/*
		let colorInput = Html.input();
		colorInput.type = "color";
		colorInput.value = ColorFactory.playerColor(game.clientId()).toString();
		pageWrapper.elm().appendChild(colorInput);
		*/

		pageWrapper.setOnSubmit(() => {
			this.dialogMessage().setDisplayName(nameWrapper.name());
			this.dialogMessage().setColor(ColorFactory.playerColor(game.clientId()).toString());
		});
	}
}