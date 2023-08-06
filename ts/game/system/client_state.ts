
import { game } from 'game'
import { EntityType } from 'game/entity/api'
import { ClientSideSystem, System } from 'game/system'
import { ClientConnectionState, ClientLoadState, SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { PlayerMessage, PlayerMessageType, PlayerProp } from 'message/player_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { NetworkBehavior } from 'network/api'

import { ui } from 'ui'
import { DialogType, DialogButtonType } from 'ui/api'

export class ClientState extends ClientSideSystem implements System {

	private _displayName : string;
	private _connectionState : ClientConnectionState;
	private _loadState : ClientLoadState;
	private _playerMsg : PlayerMessage;

	constructor(clientId : number) {
		super(SystemType.CLIENT_STATE, clientId);

		this.setName({
			base: "client_state",
			id: clientId,
		});

		this._displayName = "";
		this._connectionState = ClientConnectionState.CONNECTED;
		this._loadState = ClientLoadState.WAITING;
		this._playerMsg = new PlayerMessage(PlayerMessageType.LOADOUT);
		this._playerMsg.setProp<number>(PlayerProp.SEQ_NUM, 0);
		this._playerMsg.setProp<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.BAZOOKA);

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

		// TODO: set equals() method based on seq num
		this.addProp<Object>({
			has: () => {
				const seqNum = this._playerMsg.getProp<number>(PlayerProp.SEQ_NUM);
				return seqNum > 0 && (
					!this._playerMsg.hasProp(PlayerProp.HOST_SEQ_NUM) ||
					seqNum > this._playerMsg.getProp<number>(PlayerProp.HOST_SEQ_NUM)
				);
			},
			validate: (obj : Object) => {
				this._playerMsg.parseObject(obj);
				this.setLoadState(ClientLoadState.READY);
			},
			export: () => {
				if (this.isHost()) {
					this._playerMsg.setProp<number>(PlayerProp.HOST_SEQ_NUM, this._playerMsg.getProp<number>(PlayerProp.SEQ_NUM));
				}
				return this._playerMsg.toObject();
			},
			import: (obj : Object) => {
				this._playerMsg.parseObject(obj);
			},
		})
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

	equipType() : EntityType {
		return this._playerMsg.getProp<EntityType>(PlayerProp.EQUIP_TYPE);
	}

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

		if (!this.isSource()) {
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
					onSelect: () => {
						this._playerMsg.setProp<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.BAZOOKA);
					},
				}, {
					type: DialogButtonType.IMAGE,
					title: "sniper",
					onSelect: () => {
						this._playerMsg.setProp<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.SNIPER);
					},
				}],
			},
			]);
			msg.setProp(UiProp.ON_SUBMIT, () => {
				if (this.isHost()) {
					this.setLoadState(ClientLoadState.READY);
				} else {
					this._playerMsg.setProp<number>(PlayerProp.SEQ_NUM, this._playerMsg.getProp<number>(PlayerProp.SEQ_NUM) + 1);
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