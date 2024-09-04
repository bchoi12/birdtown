
import { game } from 'game'
import { GameState } from 'game/api'
import { GameData } from 'game/game_data'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { ClientSystem, System } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'
import { ClientDialogSyncer } from 'game/system/client_dialog_syncer'
import { EquipPairs } from 'game/util/equip_pairs'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { DialogMessage } from 'message/dialog_message'

import { DialogType } from 'ui/api'

import { isLocalhost } from 'util/common'
import { LinkedList } from 'util/linked_list'

export class ClientDialog extends ClientSystem implements System {

	private _showQueue : LinkedList<DialogType>;
	private _forceSubmitQueue : LinkedList<DialogType>;

	constructor(clientId : number) {
		super(SystemType.CLIENT_DIALOG, clientId);

		this._showQueue = new LinkedList();
		this._forceSubmitQueue = new LinkedList();

		this.addProp<DialogType>({
			has: () => { return !this._showQueue.empty(); },
			export: () => {
				return this._showQueue.popFirst().value();
			},
			import: (obj : DialogType) => {
				this.showDialog(obj);
			},
			options: {
				filters: GameData.tcpFilters,
				clearAfterPublish: true,
			},
		});
		this.addProp<DialogType>({
			has: () => { return !this._forceSubmitQueue.empty(); },
			export: () => { return this._forceSubmitQueue.popFirst().value(); },
			import: (obj : DialogType) => { this.forceSubmit(obj); },
			options: {
				filters: GameData.tcpFilters,
				clearAfterPublish: true,
			},
		});

		for (const stringType in DialogType) {
			const type = Number(DialogType[stringType]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}
			this.addSubSystem(type, new ClientDialogSyncer(type, clientId));
		}

		// TESTING ONLY
		const pair = this.isSource() && isLocalhost() ? [EntityType.SHOTGUN, EntityType.COWBOY_HAT] : EquipPairs.random();
		let loadout = this.message(DialogType.LOADOUT);
		loadout.setEquipType(pair[0]);
		loadout.setAltEquipType(pair[1]);
		loadout.setPlayerType(ModifierPlayerType.NONE);
	}

	override initialize() : void {
		super.initialize();

		if (this.clientIdMatches()) {
			this.showDialog(DialogType.INIT);
		}
	}

	pushShowDialog(type : DialogType) : void {
		if (this.clientIdMatches()) {
			this.showDialog(type);
		} else if (this.isSource()) {
			this._showQueue.push(type);
		}
	}
	private showDialog(type : DialogType) : void { this.syncer(type).showDialog(); }

	pushForceSubmit(type : DialogType) : void {
		if (this.clientIdMatches()) {
			this.forceSubmit(type);			
		} else if (this.isSource()) {
			this._forceSubmitQueue.push(type);
		}
	}
	private forceSubmit(type : DialogType) : void { this.syncer(type).forceSubmit(); }

	syncer(type : DialogType) : ClientDialogSyncer { return this.subSystem<ClientDialogSyncer>(<number>type); }
	inSync(type : DialogType) : boolean { return this.syncer(type).inSync(); }
	message(type : DialogType) : DialogMessage { return this.syncer(type).message(); }
	submit(type : DialogType) : void { this.syncer(type).submit(); }
}