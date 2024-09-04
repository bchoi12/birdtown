
import { game } from 'game'
import { GameState } from 'game/api'
import { EntityType } from 'game/entity/api'
import { GameData, DataFilter } from 'game/game_data'
import { ClientSideSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType } from 'message/game_message'
import { DialogMessage } from 'message/dialog_message'

import { ui } from 'ui'
import { DialogType, FeedType, TooltipType } from 'ui/api'

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

export class ClientDialogSyncer extends ClientSideSystem implements System {

	private _dialogType : DialogType;
	private _dialogState : DialogState;
	private _message : DialogMessage
	private _stagingMsg : DialogMessage;

	constructor(dialogType : DialogType, clientId : number) {
		super(SystemType.CLIENT_DIALOG_SYNCER, clientId);

		this._dialogType = dialogType;
		this._dialogState = DialogState.UNKNOWN;
		this._message = new DialogMessage(dialogType);
		this._stagingMsg = new DialogMessage(dialogType);

		this.addProp<DialogState>({
			has: () => { return this._dialogState !== DialogState.UNKNOWN; },
			validate: (obj : DialogState) => {
				if (obj === DialogState.ERROR) {
					this.setDialogState(obj);
				}
			},
			export: () => { return this._dialogState; },
			import: (obj : DialogState) => { this.setDialogState(obj); },
			options: {
				conditionalInterval: (obj: DialogState, elapsed : number) => {
					return this._dialogState !== DialogState.NOT_REQUESTED && elapsed >= 250;
				},
				filters: GameData.tcpFilters,
			},
		});

		this.addProp<MessageObject>({
			has: () => { return this._dialogState === DialogState.PENDING; },
			validate: (obj : MessageObject) => {
				if (this._dialogState !== DialogState.PENDING) { return; }

				this._stagingMsg.parseObject(obj);
				if (!this._stagingMsg.valid()) {
					return;
				}

				if (this._stagingMsg.getVersion() >= this._message.getVersionOr(0)) {
					this._message.merge(this._stagingMsg);
					this.setDialogState(DialogState.IN_SYNC);
				}
			},
			export: () => { return this._message.exportObject(); },
			import: (obj : MessageObject) => {
				this._stagingMsg.parseObject(obj);
				if (!this._stagingMsg.valid()) {
					return;
				}
				if (this._stagingMsg.getVersion() >= this._message.getVersionOr(0)) {
					this._message.merge(this._stagingMsg);
					this.propagateIfHost();
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

	private propagateIfHost() : void {
		if (!this.isHost()) {
			return;
		}

		switch(this._message.type()) {
		case DialogType.INIT:
			game.tablet(this.clientId()).setColor(this._message.getColor());
			game.tablet(this.clientId()).setDisplayName(this._message.getDisplayName());
			break;
		case DialogType.LOADOUT:
			if (game.controller().gameState() === GameState.SETUP) {
	    		let msg = new GameMessage(GameMessageType.FEED);
	    		msg.setNames([game.tablet(this.clientId()).displayName()]);
		    	msg.setFeedType(FeedType.READY);
		    	game.announcer().broadcast(msg);
			}
			break;
		}
	}

	setDialogState(state : DialogState) : void {
		if (this.isHost() && state === DialogState.PENDING) {
			// Host is always in sync.
			this._dialogState = DialogState.IN_SYNC;
			return;
		}
		this._dialogState = state;
	}

	forceSubmit() : void {
		if (!this.isSource()) { return; }

		if (this._dialogState === DialogState.OPEN || this._dialogState === DialogState.PENDING) {
			console.error("Warning: force submitting dialog %s for %s", DialogType[this._dialogType], this.name());

			this.submit();
			this.setDialogState(DialogState.ERROR);

			ui.showTooltip(TooltipType.FAILED_DIALOG_SYNC, {
				ttl: 3000,
			});
		}
	}
	inSync() : boolean {
		if (this._dialogState === DialogState.PENDING || this._dialogState === DialogState.OPEN) {
			return false;
		}
		return true;
	}
	message() : DialogMessage { return this._message; }
	submit() : void {
		this._message.setVersion(this._message.getVersionOr(0) + 1);
		this.setDialogState(DialogState.PENDING);

		this.propagateIfHost();
	}

	showDialog() : void {
		this.setDialogState(DialogState.OPEN);

		if (this.isSource()) {
			if (isLocalhost()) {
				console.log("%s: show dialog %s", this.name(), DialogType[this._dialogType]);
			}

			ui.pushDialog(this._dialogType);
		}
	}
}