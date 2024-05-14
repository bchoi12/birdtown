
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'

import { DialogType } from 'ui/api'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class LoadoutDialogWrapper extends ClientDialogWrapper {

	constructor() {
		super(DialogType.LOADOUT);

		this.titleElm().textContent = "Pick Your Loadout";

		this.addModifierPage();
		this.addWeaponPage();
	}

	private addModifierPage() : void {
		let pageWrapper = this.addPage();
		{
			let buttonWrapper = new ButtonWrapper();
			buttonWrapper.setText("BIG");
			buttonWrapper.addOnClick(() => {
				this.dialogMessage().setPlayerType(ModifierPlayerType.BIG);
				this.nextPage();
			});
			pageWrapper.elm().appendChild(buttonWrapper.elm());
		}

		{
			let buttonWrapper = new ButtonWrapper();
			buttonWrapper.setText("NORMAL");
			buttonWrapper.addOnClick(() => {
				this.dialogMessage().setPlayerType(ModifierPlayerType.NONE);
				this.nextPage();
			});
			pageWrapper.elm().appendChild(buttonWrapper.elm());
		}
	}

	private addWeaponPage() : void {
		let pageWrapper = this.addPage();
		{
			let buttonWrapper = new ButtonWrapper();
			buttonWrapper.setText("Bazooka");
			buttonWrapper.addOnClick(() => {
				this.dialogMessage().setEquipType(EntityType.BAZOOKA);
				this.dialogMessage().setAltEquipType(EntityType.JETPACK);
				this.nextPage();
			});
			pageWrapper.elm().appendChild(buttonWrapper.elm());
		}

		{
			let buttonWrapper = new ButtonWrapper();
			buttonWrapper.setText("Sniper");
			buttonWrapper.addOnClick(() => {
				this.dialogMessage().setEquipType(EntityType.SNIPER);
				this.dialogMessage().setAltEquipType(EntityType.SCOUTER);
				this.nextPage();
			});
			pageWrapper.elm().appendChild(buttonWrapper.elm());
		}
	}
}