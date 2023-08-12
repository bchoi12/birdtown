
import { game } from 'game'
import { GameState } from 'game/api'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { GameData, DataFilter } from 'game/game_data'
import { ClientSideSystem, System } from 'game/system'
import { ClientConnectionState, SystemType } from 'game/system/api'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { PlayerMessage, PlayerMessageType, PlayerProp } from 'message/player_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { NetworkBehavior } from 'network/api'

import { ui } from 'ui'
import { DialogButtonAction, DialogType, DialogButtonType } from 'ui/api'

export class ClientState extends ClientSideSystem implements System {

	private _displayName : string;
	private _connectionState : ClientConnectionState;
	private _gameState : GameState;
	private _loadoutMsg : PlayerMessage;

	constructor(clientId : number) {
		super(SystemType.CLIENT_STATE, clientId);

		this.setName({
			base: "client_state",
			id: clientId,
		});

		this._displayName = "";
		this._connectionState = ClientConnectionState.CONNECTED;
		this._gameState = GameState.WAITING;
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
		this.addProp<GameState>({
			has: () => { return this.gameState() !== GameState.UNKNOWN; },
			export: () => { return this.gameState(); },
			import: (obj : GameState) => { this.setGameState(obj); },
		});

		this.addProp<Object>({
			has: () => {
				if (this.gameState() !== GameState.SETUP) {
					return false;
				}
				if (this.isHost()) {
					return true;
				}
				const version = this._loadoutMsg.getPropOr<number>(PlayerProp.VERSION, 0);
				return version > this._loadoutMsg.localVersion();
			},
			validate: (obj : Object) => {
				this._loadoutMsg.parseObject(obj);

				const version = this._loadoutMsg.getPropOr<number>(PlayerProp.VERSION, 0);
				if (version > this._loadoutMsg.localVersion()) {
					this.setGameState(GameState.GAMING);
					this._loadoutMsg.setLocalVersion(version);
					console.log("validate", this.name(), this._loadoutMsg);
				}
			},
			export: () => {
				console.log("export", this.name(), this._loadoutMsg);
				return this._loadoutMsg.toObject();
			},
			import: (obj : Object) => {
				this._loadoutMsg.parseObject(obj);
				console.log("import", this.name(), this._loadoutMsg, obj);
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
			if (this._gameState === GameState.LOADING) {
				this.setGameState(GameState.SETUP);
			}
			break;
		case GameMessageType.GAME_STATE:
			this.setGameState(msg.getProp<GameState>(GameProp.STATE));
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

	gameState() : GameState { return this._gameState; }
	setGameState(state : GameState) : void {
		if (this._gameState === state) {
			return;
		}

		this._gameState = state;
		console.log("load", this.name(), state);

		if (!this.clientIdMatches()) {
			return;
		}

		// TODO: stick this in GameMaker?
		switch(this._gameState) {		
		case GameState.SETUP:
			let msg = new UiMessage(UiMessageType.DIALOG);
			msg.setProp(UiProp.TYPE, DialogType.PICK_LOADOUT);
			msg.setProp(UiProp.PAGES, [{
				buttons: [{
					type: DialogButtonType.IMAGE,
					title: "bazooka",
					action: DialogButtonAction.SUBMIT,
					onSelect: () => {
						this._loadoutMsg.setProp<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.BAZOOKA);
						console.log("bazook", this.name(), this._loadoutMsg);
					},
				}, {
					type: DialogButtonType.IMAGE,
					title: "sniper",
					action: DialogButtonAction.SUBMIT,
					onSelect: () => {
						this._loadoutMsg.setProp<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.SNIPER);
						console.log("snipe", this.name(), this._loadoutMsg);
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
					this.setGameState(GameState.GAMING);
				} else {
					this._loadoutMsg.setProp<number>(PlayerProp.VERSION, this._loadoutMsg.localVersion() + 1);
					console.log("submit", this.name(), this._loadoutMsg);
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