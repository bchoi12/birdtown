
import { game } from 'game'
import { ClientSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'

export enum LoadState {
	UNKNOWN,
	WAITING,
	LOADED,
	CHECK_READY,
	READY,
}

export class ClientState extends ClientSystem implements System {

	private _displayName : string;
	private _loadState : LoadState;

	constructor(clientId : number) {
		super(SystemType.CLIENT_STATE, clientId);

		this.setName({
			base: "client_state",
			id: clientId,
		});

		this._displayName = "";
		this._loadState = LoadState.WAITING;

		this.addProp<string>({
			has: () => { return this.hasDisplayName(); },
			export: () => { return this._displayName; },
			import: (obj: string) => { this._displayName = obj; },
		});
		this.addProp<LoadState>({
			has: () => { return this.loadState() !== LoadState.UNKNOWN; },
			export: () => { return this.loadState(); },
			import: (obj : LoadState) => { this.setLoadState(obj); },
		});
	}

	override ready() : boolean {
		return super.ready() && this.hasDisplayName();
	}

	override initialize() : void {
		super.initialize();

		const msg = new UiMessage(UiMessageType.CLIENT);
		msg.setProp(UiProp.CLIENT_ID, this.clientId());
		msg.setProp(UiProp.DISPLAY_NAME, this.displayName());
		ui.handleMessage(msg);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch(msg.type()) {
		case GameMessageType.LEVEL_LOAD:
			this.setLoadState(LoadState.LOADED);
			break;
		}
	}

	private hasDisplayName() : boolean { return this._displayName.length > 0; }
	setDisplayName(name : string) : void { this._displayName = name; }
	displayName() : string { return this._displayName; }

	loadState() : LoadState { return this._loadState; }
	setLoadState(state : LoadState) : void {
		if (this._loadState === state) {
			return;
		}

		this._loadState = state;

		if (!this.isSource()) {
			return;
		}

		switch(this._loadState) {		
		case LoadState.CHECK_READY:
			let msg = new UiMessage(UiMessageType.DIALOG);
			msg.setProp(UiProp.TYPE, DialogType.CHECK_READY);
			msg.setProp(UiProp.ON_SUBMIT, () => {
				this.setLoadState(LoadState.READY);
			});
			ui.handleMessage(msg);
			break;
		}
	}
}