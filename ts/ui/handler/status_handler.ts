
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { LoadoutType } from 'game/system/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, StatusType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { StatusWrapper } from 'ui/wrapper/status_wrapper'

export class StatusHandler extends HandlerBase implements Handler {

	// Temporary statuses
	private static readonly _ttl = new Map<StatusType, number>([
		[StatusType.DEGRADED, 3 * 1000],
		[StatusType.HOST_DEGRADED, 3 * 1000],
		[StatusType.KEYS, 8 * 1000],
		[StatusType.SPECTATING, 10 * 1000],
	]);

	private _statusElm : HTMLElement;
	private _stateWrappers : Map<GameState, StatusWrapper>;
	private _statusWrappers : Map<StatusType, StatusWrapper>;
	private _state : GameState;
	private _statuses : Set<StatusType>;
	private _timeouts : Map<StatusType, number>;
	private _disabledStatuses : Set<StatusType>;

	private _showKeys : boolean;
	private _signalingDisconnected : boolean;

	constructor() {
		super(HandlerType.STATUS);

		this._statusElm = Html.elm(Html.divStatus);
		this._stateWrappers = new Map();
		this._statusWrappers = new Map();
		this._state = GameState.UNKNOWN;
		this._statuses = new Set();
		this._timeouts = new Map();
		this._disabledStatuses = new Set();

		this._showKeys = false;
		this._signalingDisconnected = false;
	}

	override setup() : void {
		super.setup();

		for (const stringState in GameState) {
			const state = Number(GameState[stringState]);
			if (Number.isNaN(state) || state <= 0) {
				continue;
			}

			let wrapper = new StatusWrapper();
			wrapper.hide();
			this._statusElm.appendChild(wrapper.elm())
			this._stateWrappers.set(state, wrapper);
		}

		for (const stringStatus in StatusType) {
			const type = Number(StatusType[stringStatus]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			let wrapper = new StatusWrapper();
			wrapper.hide();
			this._statusElm.appendChild(wrapper.elm())
			this._statusWrappers.set(type, wrapper);
		}
	}

	override setVisible(visible : boolean) : void {
		super.setVisible(visible);

		if (visible) {
			this._statusElm.style.visibility = "visible";
		} else {
			this._statusElm.style.visibility = "hidden";
		}
	}

	override reset() : void {
		super.reset();

		this.clearAllStatuses();
	}

	override onPlayerInitialized() {
		super.onPlayerInitialized();

		if (game.controller().gameState() === GameState.FREE) {
			this.addStatus(StatusType.KEYS);
		} else {
			this._showKeys = true;
		}
	}

	setSignalingDisconnected(disconnected : boolean) : void {
		if (this._signalingDisconnected === disconnected) {
			return;
		}

		this._signalingDisconnected = disconnected;
		this.refreshState(GameState.FREE);
	}
	currentStatuses() : Set<StatusType> { return this._statuses; }
	disableStatus(type : StatusType) : void {
		this._disabledStatuses.add(type);
		this.clearStatus(type);
	}
	clearStatus(type : StatusType) : void {
		this.hideStatus(type);
	}
	clearAllStatuses() : void {
		this._statuses.forEach((type : StatusType) => {
			this.hideStatus(type);
		});
		this.hideState(this._state);
	}

	setGameState(state : GameState) : void {
		this.setState(state);
	}

	setState(state : GameState) : void {
		if (state === GameState.UNKNOWN) {
			return;
		}
		if (!this._stateWrappers.has(state)) {
			console.error("Error: %s was not initialized", GameState[state]);
			return;
		}

		if (this._state !== state) {
			this.refreshState(state);
		}

		this.showState(state);

		if (state === GameState.FREE && this._showKeys) {
			this.addStatus(StatusType.KEYS);
			this._showKeys = false;
		}
	}

	private refreshState(state : GameState) : void {
		if (!this._stateWrappers.has(state)) {
			return;
		}

		let wrapper = this._stateWrappers.get(state);
		switch (state) {
		case GameState.FREE:
			if (this._signalingDisconnected) {
				wrapper.setText("Lost connection to matchmaking server!\r\nYou can still play, but no new players can join");
			} else if (game.isHost()) {
				wrapper.setText(`Invite your friends!\r\nRoom: ${game.netcode().room()}`);
			} else {
				wrapper.setText(`Waiting for host to start a game...\r\nRoom: ${game.netcode().room()}`);
			}
			break;
		case GameState.LOAD:
			wrapper.setHTML(`Loading...\r\n\nHold ${KeyNames.keyTypeHTML(KeyType.SCOREBOARD)} to view the rules`);
			break;
		case GameState.SETUP:
			if (game.controller().config().getStartingLoadout() === LoadoutType.CHOOSE_TURNS || game.controller().config().getStartingLoadout() === LoadoutType.PICK_TURNS) {
				wrapper.setHTML(`Waiting for your opponent to pick the loadout...\r\n\nHold ${KeyNames.keyTypeHTML(KeyType.SCOREBOARD)} to view the rules`);
			} else {
				wrapper.setHTML(`Waiting for all players to be ready...\r\n\nHold ${KeyNames.keyTypeHTML(KeyType.SCOREBOARD)} to view the rules`);
			}
			break;
		}
	}

	addStatus(type : StatusType) : void {
		if (this._disabledStatuses.has(type)) {
			return;
		}
		if (!this._statusWrappers.has(type)) {
			console.error("Error: %s was not initialized", StatusType[type]);
			return;
		}
		if (!StatusHandler._ttl.has(type)) {
			console.error("Error: %s status missing TTL", StatusType[type]);
			return;
		}

		if (!this._statuses.has(type)) {
			let wrapper = this._statusWrappers.get(type);
			switch (type) {
			case StatusType.DEGRADED:
				wrapper.setHTML(`Your game is running slowly\r\nPress ${KeyNames.keyTypeHTML(KeyType.MENU)} to adjust your settings`);
				break;
			case StatusType.HOST_DEGRADED:
				wrapper.setText("Your host is currently lagging or tabbed out");
				break;
			case StatusType.KEYS:
				wrapper.setHTML(
					`Use ${KeyNames.keyTypeHTML(KeyType.LEFT)} and ${KeyNames.keyTypeHTML(KeyType.RIGHT)} to move\r\n\r\n` +
					`Press ${KeyNames.keyTypeHTML(KeyType.JUMP)} to jump/double jump`
				);
				break;
			case StatusType.SPECTATING:
				wrapper.setHTML(`Spectating\r\nPress ${KeyNames.keyTypeHTML(KeyType.LEFT)} or ${KeyNames.keyTypeHTML(KeyType.RIGHT)} to change players`);
				break;
			}
		}

		this.showStatus(type);
	}

	private showState(state : GameState) : void {
		if (!this._stateWrappers.has(state)) {
			return;
		}

		if (this._state !== state) {
			this.hideState(this._state);
			this._state = state;
		}

		if (this._statuses.size > 0) {
			return;
		}

		this._stateWrappers.get(this._state).show();
	}
	private hideState(state : GameState) : void {
		if (!this._stateWrappers.has(state)) {
			return;
		}

		this._stateWrappers.get(state).hide();
	}

	private showStatus(type : StatusType) : void {
		if (!this._statusWrappers.has(type)) {
			return;
		}

		this.hideState(this._state);

		this._statuses.add(type);
		this._statusWrappers.get(type).show();

		if (this._timeouts.has(type)) {
			window.clearTimeout(this._timeouts.get(type));
		}
		this._timeouts.set(type, window.setTimeout(() => {
			this.hideStatus(type);
		}, StatusHandler._ttl.get(type)));
	}
	private hideStatus(type : StatusType) : void {
		if (!this._statusWrappers.has(type)) {
			return;
		}

		this._statusWrappers.get(type).hide();
		this._statuses.delete(type);

		if (this._timeouts.has(type)) {
			window.clearTimeout(this._timeouts.get(type));
			this._timeouts.delete(type);
		}

		if (this._statuses.size === 0) {
			this.showState(this._state);
		}
	}
}