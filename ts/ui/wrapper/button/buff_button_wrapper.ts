
import { game } from 'game'
import { BuffType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { BuffFactory } from 'game/factory/buff_factory'

import { StringFactory } from 'strings/string_factory'

import { settings } from 'settings'

import { KeyType } from 'ui/api'
import { Icon, IconType } from 'ui/common/icon'
import { KeyNames } from 'ui/common/key_names'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'
import { TagWrapper } from 'ui/wrapper/tag_wrapper'
import { LoadoutButtonWrapper } from 'ui/wrapper/button/loadout_button_wrapper'

export class BuffButtonWrapper extends LoadoutButtonWrapper<BuffType> {

	protected override unknownValue() : BuffType { return BuffType.UNKNOWN; }
	protected override getName(type : BuffType) : string {
		if (BuffFactory.isStarter(type)) {
			return StringFactory.getBuffName(type);
		}

		const currentLevel = this.buffLevel(type);
		if (currentLevel >= 1) {
			if (currentLevel === BuffFactory.maxLevel(type) - 1) {
				return `${StringFactory.getBuffName(type)} LvMAX`; 
			}
			return `${StringFactory.getBuffName(type)} Lv${currentLevel + 1}`;
		}
		return StringFactory.getBuffName(type);
	}
	protected override getDescription(type : BuffType) : string {
		if (settings.showBuffStats()) {
			return this.getDetailedDescription(type) + "\n";
		}
		return StringFactory.getBuffDescription(type) + "\n";
	}
	protected override getIconType(type : BuffType) : IconType {
		return Icon.getBuffIconType(type);
	}

	private getDetailedDescription(type : BuffType) : string {
		let description = [];

		const level = this.buffLevel(type);
		description.push(BuffFactory.preview(type, level + 1).join(" • "));

		const incompatible = this.getIncompatibleDescription(type);
		if (BuffFactory.autoLevels(type)) {
			description.push(`Auto level up until Lv${BuffFactory.maxLevel(type)} ${incompatible}`)
		} else {
			description.push(`Lv${level + 1}/${BuffFactory.maxLevel(type)} ${incompatible}`)
		}
		return description.join("\n");
	}

	private buffLevel(type : BuffType) : number {
		return game.playerState().targetEntity().buffLevel(type);
	}

	private getIncompatibleDescription(type : BuffType) : string {
		let incompatible = BuffFactory.incompatibleBuffs(type)
		if (incompatible.size > 0) {
			const names : string = Array.from(incompatible).map(type => StringFactory.getBuffName(type)).join(", ");
			return `(Incompatible with ${names})`;
		}
		return "";
	}
}