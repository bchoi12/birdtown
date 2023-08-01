
import { game } from 'game'
import { ClientSystem, System } from 'game/system'
import { ClientConnectionState, ClientLoadState, SystemType } from 'game/system/api'

import { PlayerMessage, PlayerMessageType, PlayerProp } from 'message/player_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'

export class PlayerState extends ClientSystem implements System {

	private _loadout : PlayerMessage;

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this.setName({
			base: "player_state",
			id: clientId,
		});
	}
}