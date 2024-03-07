
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'

import { DialogType } from 'ui/api'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class LoadoutDialogWrapper extends DialogWrapper {

	constructor() {
		super(DialogType.LOADOUT);

		this.setTitle("Pick Your Loadout");

		this.addModifierPage();
		this.addWeaponPage();
	}

	private addModifierPage() : void {
		let pageWrapper = this.addPage();
		let groupIndex = pageWrapper.addButtonGroup();

		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "BIG";
			buttonWrapper.addOnSelect(() => {
				this.dialogMessage().setPlayerType(ModifierPlayerType.BIG);
				pageWrapper.submit();
			});
		}

		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "NORMAL";
			buttonWrapper.addOnSelect(() => {
				this.dialogMessage().setPlayerType(ModifierPlayerType.NONE);
				pageWrapper.submit();
			});
		}
	}

	private addWeaponPage() : void {
		let pageWrapper = this.addPage();
		let groupIndex = pageWrapper.addButtonGroup();

		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "Bazooka";
			buttonWrapper.addOnSelect(() => {
				this.dialogMessage().setEquipType(EntityType.BAZOOKA);
				this.dialogMessage().setAltEquipType(EntityType.JETPACK);
				pageWrapper.submit();
			});
		}

		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "Sniper";
			buttonWrapper.addOnSelect(() => {
				this.dialogMessage().setEquipType(EntityType.SNIPER);
				this.dialogMessage().setAltEquipType(EntityType.SCOUTER);
				pageWrapper.submit();
			});
		}
	}
}