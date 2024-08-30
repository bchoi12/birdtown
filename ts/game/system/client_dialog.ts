
import { game } from 'game'
import { GameState } from 'game/api'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { ClientSideSystem, System } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'
import { ClientDialogSyncer } from 'game/system/client_dialog_syncer'
import { EquipPairs } from 'game/util/equip_pairs'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { DialogMessage } from 'message/dialog_message'

import { DialogType } from 'ui/api'

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
		const pair = EquipPairs.random();
		loadout.setEquipType(EntityType.SHOTGUN);
		loadout.setAltEquipType(EntityType.COWBOY_HAT);
		loadout.setPlayerType(ModifierPlayerType.NONE);
	}

	override initialize() : void {
		super.initialize();

		if (this.clientIdMatches()) {
			this.showDialog(DialogType.INIT);
		}
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.GAME_STATE:
			switch (msg.getGameState()) {
			case GameState.GAME:
				this.forceSubmit(DialogType.LOADOUT);
				break;
			}
			break;
		}
	}

	forceSubmit(type : DialogType) : void { this.syncer(type).forceSubmit(); }
	syncer(type : DialogType) : ClientDialogSyncer { return this.subSystem<ClientDialogSyncer>(<number>type); }
	inSync(type : DialogType) : boolean { return this.syncer(type).inSync(); }
	message(type : DialogType) : DialogMessage { return this.syncer(type).message(); }
	showDialog(type : DialogType) : void { this.syncer(type).showDialog(); }
	submit(type : DialogType) : void { this.syncer(type).submit(); }
}