
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
import { ChoiceDialogWrapper } from 'ui/wrapper/dialog/client/choice_dialog_wrapper'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export enum BuffDialogType {
	UNKNOWN,

	INIT,
	NORMAL,
	BONUS,
}

export class BuffDialogWrapper extends ChoiceDialogWrapper {

	constructor(type : BuffDialogType) {
		// Share LOADOUT with LoadoutDialogWrapper
		super(DialogType.LOADOUT);

		this.setTitle("Buff");

		if (type === BuffDialogType.INIT) {
			this.addChoosePage(3);
		}

		this.addBuffPage();

		if (type === BuffDialogType.BONUS) {
			this.addBuffUpgradePage();
		}

		this.addSubmitTimer(game.controller().timeLimit(GameState.SETUP));
	}
}