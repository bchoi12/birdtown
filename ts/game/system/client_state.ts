
import { game } from 'game'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { GameData, DataFilter } from 'game/game_data'
import { ClientSideSystem, System } from 'game/system'
import { ClientConnectionState, ClientLoadState, SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { PlayerMessage, PlayerMessageType, PlayerProp } from 'message/player_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { NetworkBehavior } from 'network/api'

import { ui } from 'ui'
import { DialogButtonAction, DialogType, DialogButtonType } from 'ui/api'

export class ClientState extends ClientSideSystem implements System {

	private _displayName : string;
	private _connectionState : ClientConnectionState;
	private _loadState : ClientLoadState;
	private _loadoutMsg : PlayerMessage;

	constructor(clientId : number) {
		super(SystemType.CLIENT_STATE, clientId);

		this.setName({
			base: "client_state",
			id: clientId,
		});

		this._displayName = "";
		this._connectionState = ClientConnectionState.CONNECTED;
		this._loadState = ClientLoadState.WAITING;
		this._loadoutMsg = new PlayerMessage(PlayerMessageType.LOADOUT);
		this._loadoutMsg.setProp<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.BAZOOKA);
		this._loadoutMsg.setProp<EntityType>(PlayerProp.ALT_EQUIP_TYPE, EntityType.BIRD_BRAIN);
		this._loadoutMsg.setProp<ModifierPlayerType>(PlayerProp.TYPE, ModifierPlayerType.NONE);

		this.addProp<string>({
			has: () => { return this.hasDisplayName(); },
			export: () => { return this._displayName; },
			import: (obj: string) => { this._displayName = obj; },
		});
		this.addProp<ClientConnectionState>({
			has: () => { return this.connectionState() !== ClientConnectionState.UNKNOWN; },
			export: () => { return this.connectionState(); },
			import: (obj : ClientConnectionState) => { this.setConnectionState(obj); },
		});
		this.addProp<ClientLoadState>({
			has: () => { return this.loadState() !== ClientLoadState.UNKNOWN; },
			export: () => { return this.loadState(); },
			import: (obj : ClientLoadState) => { this.setLoadState(obj); },
		});

		this.addProp<Object>({
			has: () => {
				if (this.isHost()) { return this.loadState() === ClientLoadState.CHECK_READY; }

				const version = this._loadoutMsg.getPropOr<number>(PlayerProp.VERSION, 0);
				return version > this._loadoutMsg.localVersion();
			},
			validate: (obj : Object) => {
				this._loadoutMsg.parseObject(obj);

				const version = this._loadoutMsg.getPropOr<number>(PlayerProp.VERSION, 0);
				if (version > this._loadoutMsg.localVersion()) {
					this.setLoadState(ClientLoadState.READY);
					this._loadoutMsg.setLocalVersion(version);
				}
			},
			export: () => {
				return this._loadoutMsg.toObject();
			},
			import: (obj : Object) => {
				this._loadoutMsg.parseObject(obj);
			},
			options: {
				refreshInterval: 250,
				filters: GameData.tcpFilters,
			},
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
			this.setLoadState(ClientLoadState.LOADED);
			break;
		}
	}

	loadoutMsg() : PlayerMessage { return this._loadoutMsg; }

	private hasDisplayName() : boolean { return this._displayName.length > 0; }
	setDisplayName(name : string) : void { this._displayName = name; }
	displayName() : string { return this._displayName; }

	connectionState() : ClientConnectionState { return this._connectionState }
	setConnectionState(state : ClientConnectionState) : void {
		if (this._connectionState === state) {
			return;
		}

		this._connectionState = state;

		switch(this._connectionState) {
		case ClientConnectionState.DISCONNECTED:
			if (this.isHost()) {
				game.netcode().sendChat(this.displayName() + " lost connection");
			}
			break;
		}
	}

	loadState() : ClientLoadState { return this._loadState; }
	setLoadState(state : ClientLoadState) : void {
		if (this._loadState === state) {
			return;
		}

		this._loadState = state;

		if (!this.clientIdMatches()) {
			return;
		}

		switch(this._loadState) {		
		case ClientLoadState.CHECK_READY:
			let msg = new UiMessage(UiMessageType.DIALOG);
			msg.setProp(UiProp.TYPE, DialogType.CHECK_READY);
			msg.setProp(UiProp.PAGES, [{
				buttons: [{
					type: DialogButtonType.IMAGE,
					title: "bazooka",
					action: DialogButtonAction.SUBMIT,
					onSelect: () => {
						this._loadoutMsg.setProp<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.BAZOOKA);
					},
				}, {
					type: DialogButtonType.IMAGE,
					title: "sniper",
					action: DialogButtonAction.SUBMIT,
					onSelect: () => {
						this._loadoutMsg.setProp<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.SNIPER);
					},
				}],
			}, {
				buttons: [{
					type: DialogButtonType.IMAGE,
					title: "big",
					action: DialogButtonAction.SUBMIT,
					onSelect: () => {
						this._loadoutMsg.setProp<ModifierPlayerType>(PlayerProp.TYPE, ModifierPlayerType.BIG);
					},
				}, {
					type: DialogButtonType.IMAGE,
					title: "none",
					action: DialogButtonAction.SUBMIT,
					onSelect: () => {
						this._loadoutMsg.setProp<ModifierPlayerType>(PlayerProp.TYPE, ModifierPlayerType.NONE);
					},
				}]
			},
			]);
			msg.setProp(UiProp.ON_SUBMIT, () => {
				if (this.isHost()) {
					this.setLoadState(ClientLoadState.READY);
				} else {
					this._loadoutMsg.setProp<number>(PlayerProp.VERSION, this._loadoutMsg.localVersion() + 1);
				}
			});
			ui.handleMessage(msg);
			break;
		}
	}

	override networkBehavior() : NetworkBehavior {
		if (this.connectionState() === ClientConnectionState.DISCONNECTED) {
			return this.isHost() ? NetworkBehavior.SOURCE : NetworkBehavior.COPY;
		}

		return super.networkBehavior();
	}
}