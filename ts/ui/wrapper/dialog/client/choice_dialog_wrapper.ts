
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { EntityType } from 'game/entity/api'
import { EquipFactory } from 'game/factory/equip_factory'
import { LoadoutType } from 'game/system/api'

import { StringFactory } from 'strings/string_factory'

import { DialogType } from 'ui/api'
import { Icon, IconType } from 'ui/common/icon'
import { ButtonGroupWrapper } from 'ui/wrapper/button_group_wrapper'
import { ButtonSelectWrapper } from 'ui/wrapper/button/button_select_wrapper'
import { EquipSelectWrapper } from 'ui/wrapper/button/equip_select_wrapper'
import { LoadoutButtonWrapper } from 'ui/wrapper/button/loadout_button_wrapper'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { ClientDialogWrapper } from 'ui/wrapper/dialog/client_dialog_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export abstract class ChoiceDialogWrapper extends ClientDialogWrapper {

	constructor(type : DialogType) {
		super(type);
	}

	protected addPickPage() : void {
		EquipFactory.seed(game.level().seed());

		let pageWrapper = this.addPage("Pick Loadout");
		let columns = ColumnsWrapper.withColumns(3);
		pageWrapper.elm().appendChild(columns.elm());

		const randomPair = EquipFactory.random();
		this.dialogMessage().setEquipType(randomPair[0]);
		this.dialogMessage().setAltEquipType(randomPair[1]);

		let weaponColumn = columns.column(0);
		weaponColumn.contentElm().style.fontSize = "0.65em";
		let weaponCategory = new CategoryWrapper();
		weaponCategory.setTitle("Weapons");
		weaponCategory.setAlwaysExpand(true);
		weaponColumn.contentElm().appendChild(weaponCategory.elm());

		let equipColumn = columns.column(1);
		equipColumn.contentElm().style.fontSize = "0.65em";
		equipColumn.elm().style.visibility = "hidden";
		let bestEquipsCategory = new CategoryWrapper();
		bestEquipsCategory.setTitle("Recommended Equips");
		bestEquipsCategory.setAlwaysExpand(true);

		let otherEquipsCategory = new CategoryWrapper();
		otherEquipsCategory.setTitle("Other Equips");

		equipColumn.contentElm().appendChild(bestEquipsCategory.elm());
		equipColumn.contentElm().appendChild(otherEquipsCategory.elm());

		let buttonColumn = columns.column(2);
		buttonColumn.elm().style.visibility = "hidden";
		let button = new LoadoutButtonWrapper();
		buttonColumn.contentElm().appendChild(button.elm());

		let selectedWeapon = EntityType.UNKNOWN;
		let selectedEquip = EntityType.UNKNOWN;

		let weaponButtons = new ButtonGroupWrapper<EquipSelectWrapper>();
		let weaponList = EquipFactory.weaponList();

		let specialWeapons = [];
		let specialCategory = new CategoryWrapper();
		if (game.controller().config().type() === GameMode.PRACTICE || game.controller().config().getStartingLoadout() === LoadoutType.PICK_TURNS) {
			specialWeapons = EquipFactory.specialWeapons();
			specialWeapons.forEach((type : EntityType) => {
				weaponList.push(type);
			});

			specialCategory.setTitle("Special Weapons");
			weaponColumn.contentElm().appendChild(specialCategory.elm());
		}

		for (let i = 0; i < weaponList.length; ++i) {
			let weaponButton = weaponButtons.addButton(new EquipSelectWrapper());
			weaponButton.setText(StringFactory.getEntityTypeName(weaponList[i]).toTitleString());
			weaponButton.setIcon(Icon.getEntityIconType(weaponList[i]));

			if (specialWeapons.includes(weaponList[i])) {
				specialCategory.contentElm().appendChild(weaponButton.elm());
			} else {
				weaponCategory.contentElm().appendChild(weaponButton.elm());
			}

			weaponButton.addOnMouseEnter(() => {
				if (selectedWeapon !== EntityType.UNKNOWN) {
					return;
				}
				button.updateFirst(selectedWeapon);
			})
			weaponButton.addOnClick(() => {
				selectedWeapon = weaponList[i];
				selectedEquip = EntityType.UNKNOWN;

				button.updateFirst(selectedWeapon);
				button.clearSecond();

				const equipList = EquipFactory.equipList(selectedWeapon);
				bestEquipsCategory.contentElm().innerHTML = "";
				otherEquipsCategory.contentElm().innerHTML = "";
				equipColumn.elm().style.visibility = "visible";
				buttonColumn.elm().style.visibility = "visible";

				let equipButtons = new ButtonGroupWrapper<EquipSelectWrapper>();

				equipList.recommended.forEach((equipType : EntityType) => {
					let equipButton = equipButtons.addButton(new EquipSelectWrapper());
					equipButton.setText(StringFactory.getEntityTypeName(equipType).toTitleString());
					equipButton.setIcon(Icon.getEntityIconType(equipType));
					bestEquipsCategory.contentElm().appendChild(equipButton.elm());

					equipButton.addOnMouseEnter(() => {
						if (selectedEquip !== EntityType.UNKNOWN) {
							return;
						}

						button.updateSecond(equipType);
					});
					equipButton.addOnMouseLeave(() => {
						if (selectedEquip !== EntityType.UNKNOWN) {
							return;
						}

						button.clearSecond();
					});

					equipButton.addOnClick(() => {
						selectedEquip = equipType;
						button.updateSecond(equipType);
					});
				});
				equipList.valid.forEach((equipType : EntityType) => {
					let equipButton = equipButtons.appendButton(new EquipSelectWrapper());
					equipButton.setText(StringFactory.getEntityTypeName(equipType).toTitleString());
					equipButton.setIcon(Icon.getEntityIconType(equipType));
					otherEquipsCategory.contentElm().appendChild(equipButton.elm());

					equipButton.addOnMouseEnter(() => {
						if (selectedEquip !== EntityType.UNKNOWN) {
							return;
						}

						button.updateSecond(equipType);
					});
					equipButton.addOnMouseLeave(() => {
						if (selectedEquip !== EntityType.UNKNOWN) {
							return;
						}

						button.clearSecond();
					});

					equipButton.addOnClick(() => {
						selectedEquip = equipType;
						button.updateSecond(equipType);
					});
				});
				equipList.invalid.forEach((equipType : EntityType) => {
					let equipButton = equipButtons.appendButton(new EquipSelectWrapper());
					equipButton.setText(StringFactory.getEntityTypeName(equipType).toTitleString());
					equipButton.setInvalid(true);
					otherEquipsCategory.contentElm().appendChild(equipButton.elm());
				});
			});
		}

		let okButton = this.addOKButton();
		const onClick = () => {
			if (selectedWeapon === EntityType.UNKNOWN || selectedEquip === EntityType.UNKNOWN) {
				return;
			}

			this.dialogMessage().setEquipType(selectedWeapon);
			this.dialogMessage().setAltEquipType(selectedEquip);
			this.nextPage();
		};
		button.addOnClick(onClick);
		okButton.addOnClick(onClick);
	}

	protected addChoosePage(num : number) : void {
		EquipFactory.seed(game.level().seed());
		
		let pageWrapper = this.addPage("Choose Loadout");

		const pairs = EquipFactory.randomN(num * 2);

		let columns = ColumnsWrapper.withColumns(num);
		pageWrapper.elm().appendChild(columns.elm());

		this.dialogMessage().setEquipType(pairs[0][0]);
		this.dialogMessage().setAltEquipType(pairs[0][1]);

		for (let i = 0; i < num; ++i) {
			let column = columns.column(i);
			column.elm().style.textAlign = "center";

			let button = new LoadoutButtonWrapper();
			button.updatePair(pairs[i])
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
				button.updatePair(pairs[i + num])
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

	protected addBuffPage() : void {

	}

	protected addBuffUpgradePage() : void {

	}

	protected addRerollButton() : ButtonWrapper {
		let buttonWrapper = new ButtonWrapper();
		buttonWrapper.setIcon(IconType.REROLL);
		buttonWrapper.setText("Reroll");
		buttonWrapper.elm().style.float = "right";

		this.footerElm().appendChild(buttonWrapper.elm());
		return buttonWrapper;
	}
}