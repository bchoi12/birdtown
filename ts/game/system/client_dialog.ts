
import { game } from 'game'
import { GameState } from 'game/api'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { GameData, DataFilter } from 'game/game_data'
import { ClientSideSystem, System } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'
import { ClientDialogSyncer } from 'game/system/client_dialog_syncer'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { DialogMessage } from 'message/dialog_message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { NetworkBehavior } from 'network/api'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'

import { isLocalhost } from 'util/common'

export class ClientDialog extends ClientSideSystem implements System {

	constructor(clientId : number) {
		super(SystemType.CLIENT_DIALOG, clientId);

		for (const stringType in DialogType) {
			const type = Number(DialogType[stringType]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}
			this.addSubSystem(type, new ClientDialogSyncer(type, clientId));
		}

		let loadout = this.message(DialogType.LOADOUT);
		loadout.setEquipType(EntityType.BAZOOKA);
		loadout.setAltEquipType(EntityType.JETPACK);
		loadout.setPlayerType(ModifierPlayerType.NONE);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.GAME_STATE:
			switch (msg.getGameState()) {
			case GameState.GAME:
				this.forceSync(DialogType.LOADOUT);
				break;
			}
			break;
		case GameMessageType.PLAYER_STATE:
			if (msg.getClientId() !== this.clientId()) {
				return;
			}

			switch (msg.getPlayerRole()) {
			case PlayerRole.WAITING:
				this.showDialog(DialogType.LOADOUT);
				break;
			}
		}
	}

	syncer(type : DialogType) : ClientDialogSyncer {
		return this.subSystem<ClientDialogSyncer>(<number>type);
	}
	forceSync(type : DialogType) : void {
		if (!this.isSource()) { return; }

		this.syncer(type).forceSync();
	}
	inSync(type : DialogType) : boolean {
		return this.syncer(type).inSync();
	}
	message(type : DialogType) : DialogMessage {
		return this.syncer(type).message();
	}
	submit(type : DialogType) : void {
		this.syncer(type).submit();
	}
	showDialog(type : DialogType) : void {
		this.syncer(type).showDialog();
	}
}