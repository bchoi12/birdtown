import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameMode } from 'game/api'
import { StepData } from 'game/game_object'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { Sign } from 'game/entity/sign'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { DialogButtonAction, DialogType, DialogButtonType, KeyType, KeyState, TooltipType } from 'ui/api'

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

			if (game.keys().getKey(KeyType.INTERACT).pressed()) {
				let msg = new UiMessage(UiMessageType.DIALOG);
				msg.setDialogType(DialogType.PICK_GAME_MODE);
				msg.setPages([{
					buttons: [{
						type: DialogButtonType.IMAGE,
						title: "duel",
						action: DialogButtonAction.SUBMIT,
						onSelect: () => { game.controller().startGame(GameMode.DUEL) },
					}, {
						type: DialogButtonType.IMAGE,
						title: "cancel",
						action: DialogButtonAction.SUBMIT,
					}],
				}]);
				ui.handleMessage(msg);
			}
		}
	}
}