
import { game } from 'game'
import { EntityType, BirdType } from 'game/entity/api'
import { ColorType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { settings } from 'settings'
import { FullscreenSetting } from 'settings/api'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ClientNameWrapper } from 'ui/wrapper/client_name_wrapper'
import { ColorPickWrapper } from 'ui/wrapper/color_pick_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ShareWrapper } from 'ui/wrapper/button/share_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { HexColor } from 'util/hex_color'

export class InitDialogWrapper extends ClientDialogWrapper {

	constructor() {
		super(DialogType.INIT);

		this.setTitle("Welcome to Birdtown");
		this.addNamePage();

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});

		let shareWrapper = new ShareWrapper();
		shareWrapper.setText("[Copy invite link]");
		shareWrapper.setHoverOnlyText(true);
		shareWrapper.elm().style.float = "left";
		this.footerElm().appendChild(shareWrapper.elm());

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

		let birdType = new SettingWrapper<BirdType>({
			name: "Species",
			value: BirdType.CHICKEN,
			click: (current : BirdType) => {
				if (current === BirdType.CHICKEN) {
					current = BirdType.BOOBY;
				} else {
					current++;
				}
				return current;
			},
			text: (current : BirdType) => {
				return BirdType[current];
			},
		});
		bird.contentElm().appendChild(birdType.elm());

		const playerColors = ColorFactory.entityColors(EntityType.PLAYER);
		const colors = playerColors.map((color : HexColor) => color.toString());
		let colorPick = new ColorPickWrapper();
		colorPick.addColors(...colors);
		colorPick.select(colors[Math.floor(Math.random() * colors.length)]);
		bio.contentElm().appendChild(colorPick.elm());

		pageWrapper.setOnSubmit(() => {
			this.dialogMessage().setBirdType(birdType.value());
			this.dialogMessage().setDisplayName(nameWrapper.name());
			this.dialogMessage().setColor(colorPick.selectedColor());
		});
	}
}