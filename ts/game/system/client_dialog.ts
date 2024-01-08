
import { game } from 'game'
import { GameState } from 'game/api'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { GameData, DataFilter } from 'game/game_data'
import { ClientSideSystem, System } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { DialogMessage } from 'message/dialog_message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { NetworkBehavior } from 'network/api'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'

import { isLocalhost } from 'util/common'

enum DialogState {
	UNKNOWN,

	// Dialog data isn't necessary or hasn't been requested
	NOT_REQUESTED,

	// Dialog data is requested, but not ready to be sent out
	OPEN,

	// Dialog data is pending and needs to be periodically sent out
	PENDING,

	// Everything in sync
	IN_SYNC,

	// Failed to sync, most likely client dialog didn't make it to the host
	ERROR,
}

export class ClientDialog extends ClientSideSystem implements System {

	private _states : Map<DialogType, DialogState>;
	private _messages : Map<DialogType, DialogMessage>;
	private _stagingMsg : DialogMessage;

	constructor(clientId : number) {
		super(SystemType.CLIENT_DIALOG, clientId);

		this._states = new Map();
		this._messages = new Map();
		this._stagingMsg = new DialogMessage(DialogType.UNKNOWN);

		let loadout = this.message(DialogType.PICK_LOADOUT);
		loadout.setEquipType(EntityType.BAZOOKA);
		loadout.setAltEquipType(EntityType.JETPACK);
		loadout.setPlayerType(ModifierPlayerType.NONE);

		for (const stringType in DialogType) {
			const type = Number(DialogType[stringType]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			this.addProp<DialogState>({
				has: () => { return this._states.has(type); },
				validate: (obj : DialogState) => {
					if (obj === DialogState.ERROR) {
						this.setDialogState(type, obj);
					}
				},
				export: () => { return this._states.get(type); },
				import: (obj : DialogState) => { this.setDialogState(type, obj); },
				options: {
					conditionalInterval: (obj: DialogState, elapsed : number) => {
						return this._states.get(type) !== DialogState.NOT_REQUESTED && elapsed >= 250;
					},
					filters: GameData.tcpFilters,
				},
			});

			this.addProp<MessageObject>({
				has: () => { return this.dialogState(type) === DialogState.PENDING; },
				validate: (obj : MessageObject) => {
					if (this.dialogState(type) !== DialogState.PENDING) { return; }

					this._stagingMsg.parseObject(obj);
					if (!this._stagingMsg.valid()) {
						return;
					}

					if (this._stagingMsg.getVersion() >= this.message(type).getVersionOr(0)) {
						this.message(type).merge(this._stagingMsg);
						this.setDialogState(type, DialogState.IN_SYNC);
					}
				},
				export: () => { return this.message(type).exportObject(); },
				import: (obj : MessageObject) => {
					this._stagingMsg.parseObject(obj);
					if (!this._stagingMsg.valid()) {
						return;
					}
					if (this._stagingMsg.getVersion() >= this.message(type).getVersionOr(0)) {
						this.message(type).merge(this._stagingMsg);
					}
				},
				options: {
					conditionalInterval: (obj: MessageObject, elapsed : number) => {
						return this.dialogState(type) === DialogState.PENDING && elapsed >= 500;
					},
					filters: GameData.tcpFilters,
				},
			});

		}
	}

	private dialogState(type : DialogType) : DialogState { return this._states.has(type) ? this._states.get(type) : DialogState.NOT_REQUESTED; }
	private setDialogState(type : DialogType, state : DialogState) : void {
		if (this.isHost() && state === DialogState.PENDING) {
			// Host is always in sync.
			this._states.set(type, DialogState.IN_SYNC);
			return;
		}
		this._states.set(type, state);
	}
	private resetDialogStates() : void { this._states.clear(); }

	forceSync() : void {
		if (!this.isSource()) { return; }

		let error = false;
		this._states.forEach((state : DialogState, type : DialogType) => {
			if (state === DialogState.OPEN || state === DialogState.PENDING) {
				this.setDialogState(type, DialogState.ERROR);
				error = true;
			}
		});
		if (error) {
			ui.clear();

			let tooltipMsg = new UiMessage(UiMessageType.TOOLTIP);
			tooltipMsg.setTooltipType(TooltipType.FAILED_DIALOG_SYNC);
			ui.handleMessage(tooltipMsg);
		}
	}
	inSync() : boolean {
		for (const state of this._states.values()) {
			if (state === DialogState.PENDING || state === DialogState.OPEN) {
				return false;
			}
		}
		return true;
	}
	message(type : DialogType) : DialogMessage {
		if (!this._messages.has(type)) {
			this._messages.set(type, new DialogMessage(type));
		}
		return this._messages.get(type);
	}
	submit(type : DialogType) : void {
		this.message(type).setVersion(this.message(type).getVersionOr(0) + 1);
		this.setDialogState(type, DialogState.PENDING);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.GAME_STATE:
			switch (msg.getGameState()) {
			case GameState.GAME:
				// Force close any still open dialogs.
				this.forceSync();
				break;
			}
			break;
		case GameMessageType.PLAYER_STATE:
			if (msg.getClientId() !== this.clientId()) {
				return;
			}

			switch (msg.getPlayerRole()) {
			case PlayerRole.WAITING:
				this.showDialog(DialogType.PICK_LOADOUT);
				break;
			default:
				this.resetDialogStates();
			}
		}
	}

	showDialog(type : DialogType) : void {
		this.setDialogState(type, DialogState.OPEN);

		if (this.isSource()) {
			let msg = new UiMessage(UiMessageType.DIALOG);
			msg.setDialogType(type);
			ui.handleMessage(msg);
		}
	}
}