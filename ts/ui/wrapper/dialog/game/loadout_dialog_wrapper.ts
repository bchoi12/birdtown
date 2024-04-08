
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'

import { DialogType } from 'ui/api'
import { GameDialogWrapper } from 'ui/wrapper/game_dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class LoadoutDialogWrapper extends GameDialogWrapper {

	constructor() {
		super(DialogType.LOADOUT);

		this.titleElm().textContent = "Pick Your Loadout";

		this.addModifierPage();
		this.addWeaponPage();
	}

	private addModifierPage() : void {
		let pageWrapper = this.addPage();
		{
			let buttonWrapper = pageWrapper.addButton();
			buttonWrapper.setText("BIG");
			buttonWrapper.addOnClick(() => {
				this.dialogMessage().setPlayerType(ModifierPlayerType.BIG);
				pageWrapper.submit();
			});
		}

		{
			let buttonWrapper = pageWrapper.addButton();
			buttonWrapper.setText("NORMAL");
			buttonWrapper.addOnClick(() => {
				this.dialogMessage().setPlayerType(ModifierPlayerType.NONE);
				pageWrapper.submit();
			});
		}
	}

	private addWeaponPage() : void {
		let pageWrapper = this.addPage();
		{
			let buttonWrapper = pageWrapper.addButton();
			buttonWrapper.setText("Bazooka");
			buttonWrapper.addOnClick(() => {
				this.dialogMessage().setEquipType(EntityType.BAZOOKA);
				this.dialogMessage().setAltEquipType(EntityType.JETPACK);
				pageWrapper.submit();
			});
		}

		{
			let buttonWrapper = pageWrapper.addButton();
			buttonWrapper.setText("Sniper");
			buttonWrapper.addOnClick(() => {
				this.dialogMessage().setEquipType(EntityType.SNIPER);
				this.dialogMessage().setAltEquipType(EntityType.SCOUTER);
				pageWrapper.submit();
			});
		}
	}
}