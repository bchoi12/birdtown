
import { game } from 'game'
import { GameState } from 'game/api'
import { ModifierPlayerType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { GameData, DataFilter } from 'game/game_data'
import { ClientSideSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { DataMap } from 'message'
import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { PlayerMessage, PlayerMessageType, PlayerProp } from 'message/player_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { NetworkBehavior } from 'network/api'

import { ui } from 'ui'
import { DialogButtonAction, DialogType, DialogButtonType } from 'ui/api'

import { isLocalhost } from 'util/common'

export class ClientDialog extends ClientSideSystem implements System {

	private _gameState : GameState;
	private _loadoutMsg : PlayerMessage;

	constructor(clientId : number) {
		super(SystemType.CLIENT_DIALOG, clientId);

		this.addNameParams({
			base: "client_dialog",
			id: clientId,
		});

		this._gameState = GameState.FREE;
		this._loadoutMsg = new PlayerMessage(PlayerMessageType.LOADOUT);
		this._loadoutMsg.set<EntityType>(PlayerProp.EQUIP_TYPE, EntityType.BAZOOKA);
		this._loadoutMsg.set<EntityType>(PlayerProp.ALT_EQUIP_TYPE, EntityType.BIRD_BRAIN);
		this._loadoutMsg.set<ModifierPlayerType>(PlayerProp.TYPE, ModifierPlayerType.NONE);

		this.addProp<GameState>({
			has: () => { return this.gameState() !== GameState.UNKNOWN; },
			export: () => { return this.gameState(); },
			import: (obj : GameState) => { this.setGameState(obj); },
		});

		this.addProp<Object>({
			has: () => {
				if (game.controller().gameState() !== GameState.SETUP) {
					return false;
				}

				const version = this._loadoutMsg.getOr<number>(PlayerProp.VERSION, 0);
				return version === game.controller().round();
			},
			validate: (obj : Object) => {
				if (this._loadoutMsg.finalized()) {
					return;
				}

				const version = this._loadoutMsg.getOr<number>(PlayerProp.VERSION, 0);
				this._loadoutMsg.parseObjectIf(obj, (data : DataMap) => {
					return data.hasOwnProperty(PlayerProp.VERSION) && data[PlayerProp.VERSION] === version;
				});

				if (version === game.controller().round()) {
					this._loadoutMsg.setFinalized(true);
					this.setGameState(GameState.GAME);
				}
			},
			export: () => {
				return this._loadoutMsg.exportObject();
			},
			import: (obj : Object) => {
				if (this._loadoutMsg.finalized()) {
					return;
				}

				const round = game.controller().round();
				this._loadoutMsg.parseObjectIf(obj, (data : DataMap) => {
					return data.hasOwnProperty(PlayerProp.VERSION) && data[PlayerProp.VERSION] === round;
				});

				this._loadoutMsg.setFinalized(true);
			},
			options: {
				minInterval: 500,
				filters: GameData.tcpFilters,
			},
		});
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch(msg.type()) {
		case GameMessageType.GAME_STATE:
			this.setGameState(msg.get<GameState>(GameProp.STATE));
			break;
		}
	}

	loadoutMsg() : PlayerMessage { return this._loadoutMsg; }

	gameState() : GameState { return this._gameState; }
	setGameState(state : GameState) : void {
		if (this._gameState === state) {
			return;
		}

		this._gameState = state;

		if (this.clientIdMatches() && isLocalhost()) {
			console.log("%s: game state is %s", this.name(), GameState[state]);
		}

		switch(this._gameState) {		
		case GameState.SETUP:
			this._loadoutMsg.setFinalized(false);
			break;
		}

		if (!this.clientIdMatches()) {
			return;
		}

		// TODO: stick this in GameMaker?
		switch(this._gameState) {		
		case GameState.SETUP:
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
				if (this.isHost()) {
					this._loadoutMsg.setFinalized(true);
					this.setGameState(GameState.GAME);
				}
			});
			ui.handleMessage(msg);
			break;
		}
	}
}