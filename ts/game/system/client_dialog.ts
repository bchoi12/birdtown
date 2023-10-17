
import { game } from 'game'
import { GameState } from 'game/api'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { GameData, DataFilter } from 'game/game_data'
import { ClientSideSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { DataMap, MessageObject } from 'message'
import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { PlayerMessage, PlayerMessageType, PlayerProp } from 'message/player_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { NetworkBehavior } from 'network/api'

import { ui } from 'ui'
import { DialogButtonAction, DialogType, DialogButtonType } from 'ui/api'

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
}

export class ClientDialog extends ClientSideSystem implements System {

	private _dialogState : DialogState;
	private _loadoutMsg : PlayerMessage;
	private _tempMsg : PlayerMessage;

	constructor(clientId : number) {
		super(SystemType.CLIENT_DIALOG, clientId);

		this._dialogState = DialogState.NOT_REQUESTED;

		this._loadoutMsg = new PlayerMessage(PlayerMessageType.LOADOUT);
		this._loadoutMsg.set<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.BAZOOKA);
		this._loadoutMsg.set<EntityType>(PlayerProp.ALT_EQUIP_TYPE, EntityType.BIRD_BRAIN);
		this._loadoutMsg.set<ModifierPlayerType>(PlayerProp.TYPE, ModifierPlayerType.NONE);

		// TODO: add staging support for message
		this._tempMsg = new PlayerMessage(PlayerMessageType.LOADOUT);

		this.addProp<DialogState>({
			export: () => { return this._dialogState; },
			import: (obj : DialogState) => { this.setDialogState(obj); },
			options: {
				conditionalInterval: (obj: DialogState, elapsed : number) => {
					return this._dialogState !== DialogState.NOT_REQUESTED && elapsed >= 250;
				},
				filters: GameData.tcpFilters,
			},
		});

		// IMPORTANT: override equals and manually update the object since the default equals fn always returns true
		this.addProp<MessageObject>({
			has: () => { return this._dialogState === DialogState.PENDING; },
			validate: (obj : MessageObject) => {
				if (this._dialogState !== DialogState.PENDING) {
					return;
				}
				this._tempMsg.parseObject(obj);
				if (!this._tempMsg.valid()) {
					return;
				}
				if (this._tempMsg.get<number>(PlayerProp.VERSION) >= this._loadoutMsg.getOr<number>(PlayerProp.VERSION, 0)) {
					this._loadoutMsg.merge(this._tempMsg);
					this.setDialogState(DialogState.IN_SYNC);
				}
			},
			export: () => { return this._loadoutMsg.exportObject(); },
			import: (obj : MessageObject) => {
				this._tempMsg.parseObject(obj);
				if (!this._tempMsg.valid()) {
					return;
				}
				if (this._tempMsg.get<number>(PlayerProp.VERSION) >= this._loadoutMsg.getOr<number>(PlayerProp.VERSION, 0)) {
					this._loadoutMsg.merge(this._tempMsg);
				}
			},
			options: {
				conditionalInterval: (obj: MessageObject, elapsed : number) => {
					return this._dialogState === DialogState.PENDING && elapsed >= 500;
				},
				filters: GameData.tcpFilters,
			},
		});
	}

	setDialogState(state : DialogState) : void {
		this._dialogState = state;
	}
	inSync() : boolean {
		// Host doesn't get confirmation so will always be PENDING
		return this._dialogState === DialogState.IN_SYNC || this.isSource() && this._dialogState === DialogState.PENDING;
	}
	loadoutMsg() : PlayerMessage { return this._loadoutMsg; }

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.GAME_STATE) {
			return;
		}

		if (!this.isSource()) {
			return;
		}

		switch (msg.get<GameState>(GameProp.STATE)) {
		case GameState.SETUP:
			this.showDialogs();
			break;
		default:
			this.setDialogState(DialogState.NOT_REQUESTED);
		}
	}

	private showDialogs() : void {
		this.setDialogState(DialogState.OPEN);

		let msg = new UiMessage(UiMessageType.DIALOG);
		msg.set(UiProp.TYPE, DialogType.PICK_LOADOUT);
		msg.set(UiProp.PAGES, [{
			buttons: [{
				type: DialogButtonType.IMAGE,
				title: "bazooka",
				action: DialogButtonAction.SUBMIT,
				onSelect: () => { this._loadoutMsg.set<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.BAZOOKA); },
			}, {
				type: DialogButtonType.IMAGE,
				title: "sniper",
				action: DialogButtonAction.SUBMIT,
				onSelect: () => { this._loadoutMsg.set<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.SNIPER); },
			}],
		}, {
			buttons: [{
				type: DialogButtonType.IMAGE,
				title: "big",
				action: DialogButtonAction.SUBMIT,
				onSelect: () => { this._loadoutMsg.set<ModifierPlayerType>(PlayerProp.TYPE, ModifierPlayerType.BIG) },
			}, {
				type: DialogButtonType.IMAGE,
				title: "none",
				action: DialogButtonAction.SUBMIT,
				onSelect: () => { this._loadoutMsg.set<ModifierPlayerType>(PlayerProp.TYPE, ModifierPlayerType.NONE) },
			}]
		},
		]);
		msg.set(UiProp.ON_SUBMIT, () => {
			this._loadoutMsg.set<number>(PlayerProp.VERSION, game.controller().round());
			this.setDialogState(DialogState.PENDING);
		});
		ui.handleMessage(msg);
	}
}