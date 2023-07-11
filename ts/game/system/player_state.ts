
import { game } from 'game'
import { ClientSystem, System } from 'game/system'
import { ClientConnectionState, ClientLoadState, SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { NetworkBehavior } from 'network/api'

import { ui } from 'ui'
import { DialogType } from 'ui/api'

export class PlayerState extends ClientSystem implements System {

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this.setName({
			base: "player_state",
			id: clientId,
		});
	}
}