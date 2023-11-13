
import { game } from 'game'
import { GameMode } from 'game/api'
import { EntityOptions } from 'game/entity'
import { Sign } from 'game/entity/sign'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { KeyType, KeyState, TooltipType } from 'ui/api'

export class Console extends Sign {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CONSOLE, entityOptions);
	}

	override showTooltip() : void {
		if (this.isSource()) {
			let msg = new UiMessage(UiMessageType.TOOLTIP);
			msg.setTooltipType(TooltipType.CONSOLE);
			msg.setTtl(100);
			ui.handleMessage(msg);

			if (this.key(KeyType.INTERACT, KeyState.PRESSED)) {
				game.controller().startGame(GameMode.DUEL);
			}
		}
	}
}