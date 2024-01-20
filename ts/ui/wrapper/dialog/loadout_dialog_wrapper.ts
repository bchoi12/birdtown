
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'

import { DialogType } from 'ui/api'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class LoadoutDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.addModifierPage();
		this.addWeaponPage();
		this.addOnSubmit(() => {
			game.clientDialog().submit(DialogType.LOADOUT);
		});
	}

	private addModifierPage() : void {
		let pageWrapper = this.addPage();
		let groupIndex = pageWrapper.addButtonGroup();

		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "BIG";
			buttonWrapper.setOnSelect(() => {
				game.clientDialog().message(DialogType.LOADOUT).setPlayerType(ModifierPlayerType.BIG);
				pageWrapper.submit();
			});
		}

		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "NORMAL";
			buttonWrapper.setOnSelect(() => {
				game.clientDialog().message(DialogType.LOADOUT).setPlayerType(ModifierPlayerType.NONE);
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
			buttonWrapper.setOnSelect(() => {
				game.clientDialog().message(DialogType.LOADOUT).setEquipType(EntityType.BAZOOKA);
				game.clientDialog().message(DialogType.LOADOUT).setAltEquipType(EntityType.JETPACK);
				pageWrapper.submit();
			});
		}

		{
			let buttonWrapper = pageWrapper.addButton(groupIndex);
			buttonWrapper.elm().textContent = "Sniper";
			buttonWrapper.setOnSelect(() => {
				game.clientDialog().message(DialogType.LOADOUT).setEquipType(EntityType.SNIPER);
				game.clientDialog().message(DialogType.LOADOUT).setAltEquipType(EntityType.SCOUTER);
				pageWrapper.submit();
			});
		}
	}
}