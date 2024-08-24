
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { EquipPairs } from 'game/util/equip_pairs'

import { DialogType } from 'ui/api'
import { LoadoutButtonWrapper } from 'ui/wrapper/button/loadout_button_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
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

		const num = 3;

		let columns = ColumnsWrapper.withColumns(num);
		pageWrapper.elm().appendChild(columns.elm());

		const pairs = EquipPairs.randomN(num);

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
	}
}