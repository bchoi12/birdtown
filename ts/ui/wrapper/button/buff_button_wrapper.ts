
import { game } from 'game'
import { BuffType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { BuffFactory } from 'game/factory/buff_factory'

import { StringFactory } from 'strings/string_factory'

import { KeyType } from 'ui/api'
import { Icon, IconType } from 'ui/common/icon'
import { KeyNames } from 'ui/common/key_names'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'
import { TagWrapper } from 'ui/wrapper/tag_wrapper'
import { LoadoutButtonWrapper } from 'ui/wrapper/button/loadout_button_wrapper'

export class BuffButtonWrapper extends LoadoutButtonWrapper<BuffType> {

	constructor() {
		super();
	}

	protected override unknownValue() : BuffType { return BuffType.UNKNOWN; }
	protected override getName(type : BuffType) : string {
		if (BuffFactory.isStarter(type)) {
			return StringFactory.getBuffName(type);
		}

		const currentLevel = game.playerState().targetEntity().buffLevel(type);
		if (currentLevel >= 1) {
			if (currentLevel === BuffFactory.maxLevel(type) - 1) {
				return `${StringFactory.getBuffName(type)} LvMAX`; 
			}
			return `${StringFactory.getBuffName(type)} Lv${currentLevel + 1}`;
		}
		return StringFactory.getBuffName(type);
	}
	protected override getDescription(type : BuffType) : string {
		return StringFactory.getBuffDescription(type);
	}
	protected override getIconType(type : BuffType) : IconType {
		return Icon.getBuffIconType(type);
	}
}