
import { game } from 'game'
import { EntityType, BirdType } from 'game/entity/api'
import { ColorType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { UiGlobals } from 'global/ui_globals'

import { settings } from 'settings'
import { FullscreenSetting } from 'settings/api'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { LoginNames } from 'ui/common/login_names'
import { BirdWrapper } from 'ui/wrapper/bird_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ClientNameWrapper } from 'ui/wrapper/client_name_wrapper'
import { ColorPickWrapper } from 'ui/wrapper/color_pick_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { HexColor } from 'util/hex_color'

export class InitDialogWrapper extends ClientDialogWrapper {

	constructor() {
		super(DialogType.INIT);

		this.setTitle("Welcome!");
		this.setOpaque(true);
		this.shrink();
		this.allowKeyboardSubmit();
		this.populatePage();

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});

		this.addOnSubmit(() => {
			game.setPlayerInitialized(true);
			ui.applySettings();
			ui.onPlayerInitialized();
			ui.enableAudio();
		});
	}

	private populatePage() : void {
		let pageWrapper = this.addPage();

		let columnsWrapper = ColumnsWrapper.withWeights([5, 5]);
		pageWrapper.elm().appendChild(columnsWrapper.elm());

		let bio = columnsWrapper.column(0);
		bio.elm().style.textAlign = "center";

		const nameAndColor = LoginNames.randomNameAndColor();

		bio.appendTitle("Name");
		let nameWrapper = new ClientNameWrapper(nameAndColor[0]);
		nameWrapper.nameElm().style.textAlign = "center";
		bio.contentElm().appendChild(nameWrapper.elm());
		bio.contentElm().appendChild(Html.br());

		bio.appendTitle("Favorite Color");
		const playerColors = ColorFactory.entityColors(EntityType.PLAYER);
		const colors = playerColors.map((color : HexColor) => color.toString());
		let colorPick = new ColorPickWrapper();
		colorPick.addColors(...colors);
		colorPick.select(ColorFactory.toString(nameAndColor[1]));
		bio.contentElm().appendChild(colorPick.elm());
		bio.contentElm().appendChild(Html.br());

		let bird = columnsWrapper.column(1);

		let birdPicker = new BirdWrapper();
		bird.contentElm().appendChild(birdPicker.elm());

		pageWrapper.setOnSubmit(() => {
			this.dialogMessage().setBirdType(birdPicker.type());
			this.dialogMessage().setDisplayName(nameWrapper.name());
			this.dialogMessage().setColor(colorPick.selectedColor());
		});
	}
}