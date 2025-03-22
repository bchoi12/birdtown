
import { game } from 'game'
import { GameState } from 'game/api'
import { EntityType } from 'game/entity/api'
import { EquipPairs } from 'game/util/equip_pairs'

import { DialogType } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { LoadoutButtonWrapper } from 'ui/wrapper/button/loadout_button_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class LoadoutDialogWrapper extends ClientDialogWrapper {

	constructor() {
		super(DialogType.LOADOUT);

		this.setTitle("Loadout");

		this.addWeaponPage();
	}

	private addWeaponPage() : void {
		let pageWrapper = this.addPage();

		this.setTitle("Pick a Weapon");
		this.addSubmitTimer(game.controller().timeLimit(GameState.SETUP));

		const num = 3;
		const pairs = EquipPairs.randomN(num * 2);

		let columns = ColumnsWrapper.withColumns(num);
		pageWrapper.elm().appendChild(columns.elm());

		this.dialogMessage().setEquipType(pairs[0][0]);
		this.dialogMessage().setAltEquipType(pairs[0][1]);

		for (let i = 0; i < num; ++i) {
			let column = columns.column(i);
			column.elm().style.textAlign = "center";

			let button = new LoadoutButtonWrapper();
			button.setEquipPair(pairs[i])
			button.addOnClick(() => {
				this.dialogMessage().setEquipType(pairs[i][0]);
				this.dialogMessage().setAltEquipType(pairs[i][1]);
				this.nextPage();
			});
			column.contentElm().appendChild(button.elm());
		}

		let reroll = this.addRerollButton();
		reroll.addOnClick(() => {
			this.dialogMessage().setEquipType(pairs[num][0]);
			this.dialogMessage().setAltEquipType(pairs[num][1]);

			for (let i = 0; i < num; ++i) {
				let column = columns.column(i);
				column.contentElm().innerHTML = "";

				let button = new LoadoutButtonWrapper();
				button.setEquipPair(pairs[i + num])
				button.addOnClick(() => {
					this.dialogMessage().setEquipType(pairs[i + num][0]);
					this.dialogMessage().setAltEquipType(pairs[i + num][1]);
					this.nextPage();
				});
				column.contentElm().appendChild(button.elm());
			}

			this.footerElm().removeChild(reroll.elm());
		});
	}

	private addRerollButton() : ButtonWrapper {
		let buttonWrapper = new ButtonWrapper();
		buttonWrapper.setIcon(IconType.REROLL);
		buttonWrapper.setText("Reroll");
		buttonWrapper.elm().style.float = "right";

		this.footerElm().appendChild(buttonWrapper.elm());
		return buttonWrapper;
	}
}