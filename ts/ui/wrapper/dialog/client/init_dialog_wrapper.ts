
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
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
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ShareWrapper } from 'ui/wrapper/button/share_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'
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

		let shareWrapper = new ShareWrapper();
		shareWrapper.setText("[Copy invite link]");
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

		bird.contentElm().textContent = "TODO"

		// TODO: replace with rainbow color strip
		const playerColors = ColorFactory.entityColors(EntityType.PLAYER);
		let colorSpan = Html.span();
		let color = new SettingWrapper<number>({
			name: "Favorite Color",
			value: Math.floor(Math.random() * playerColors.length),
			click: (current : number) => {
				current++;
				if (current >= playerColors.length) {
					current = 0;
				}
				return current;
			},
			html: (current : number) => {
				// Kind of jank but whatever
				const currentType = playerColors[current];
				colorSpan.style.color = ColorFactory.color(currentType).toString();

				const tokens = ColorType[currentType].split("_");
				if (tokens.length === 2) {
					colorSpan.textContent = tokens[1];
				} else {
					colorSpan.textContent = "???";
				}
				return colorSpan.outerHTML;
			},
		});
		bio.contentElm().appendChild(color.elm());

		pageWrapper.setOnSubmit(() => {
			this.dialogMessage().setDisplayName(nameWrapper.name());
			this.dialogMessage().setColor(ColorFactory.entityColor(EntityType.PLAYER, color.value()).toString());
		});
	}
}