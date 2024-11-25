
import { game } from 'game'
import { GameState } from 'game/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { StatusType, TempStatusType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { StatusWrapper } from 'ui/wrapper/status_wrapper'

enum PriorityType {
	UNKNOWN = 0,

	LOW = 1,

	MED = 2,

	HIGH = 3,
}

export class StatusHandler extends HandlerBase implements Handler {

	// Permanent statuses
	private static readonly _priority = new Map<StatusType, PriorityType>([
		[StatusType.UNKNOWN, PriorityType.UNKNOWN],
		[StatusType.LOBBY, PriorityType.MED],
		[StatusType.SPECTATING, PriorityType.LOW],
		[StatusType.LOADING, PriorityType.MED],
		[StatusType.SETUP, PriorityType.MED],
	]);

	// Temporary statuses
	private static readonly _ttl = new Map<TempStatusType, number>([
		[TempStatusType.DISCONNECTED_SIGNALING, 20 * 1000],
		[TempStatusType.DEGRADED, 4 * 1000],
		[TempStatusType.HOST_DEGRADED, 4 * 1000],
		[TempStatusType.KEYS, 8 * 1000],
	]);

	private _statusElm : HTMLElement;
	private _statusWrappers : Map<StatusType, StatusWrapper>;
	private _tempStatusWrappers : Map<TempStatusType, StatusWrapper>;
	private _permanent : StatusType;
	private _temporary : TempStatusType;
	private _disabled : Set<StatusType>;
	private _disabledTemp : Set<TempStatusType>;

	constructor() {
		super(HandlerType.STATUS);

		this._statusElm = Html.elm(Html.divStatus);
		this._statusWrappers = new Map();
		this._tempStatusWrappers = new Map();
		this._permanent = StatusType.UNKNOWN;
		this._temporary = TempStatusType.UNKNOWN;
		this._disabled = new Set();
		this._disabledTemp = new Set();
	}

	override setup() : void {
		super.setup();

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

		for (const stringStatus in TempStatusType) {
			const type = Number(TempStatusType[stringStatus]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			let wrapper = new StatusWrapper();
			wrapper.hide();
			this._statusElm.appendChild(wrapper.elm())
			this._tempStatusWrappers.set(type, wrapper);
		}
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		this.showLobbyStatuses();
	}

	override reset() : void {
		super.reset();

		this.clearAll();
	}


	displayedStatus() : StatusType | TempStatusType { return this._temporary !== TempStatusType.UNKNOWN ? this._temporary : this._permanent; }
	disableStatus(type : StatusType) : void {
		this._disabled.add(type);
		this.clearStatus(type);
	}
	disableTempStatus(type : TempStatusType) : void {
		this._disabledTemp.add(type);
		this.clearTempStatus(type);
	}
	clearAll() : void {
		this.clearStatus(this._permanent);
		this.clearTempStatus(this._temporary);
	}

	showLobbyStatuses() : void {
		if (game.controller().gameState() === GameState.FREE) {
			this.clearAll();
			this.showStatus(StatusType.LOBBY);
			this.showTempStatus(TempStatusType.KEYS);
		}
	}

	showStatus(type : StatusType) : void {
		if (this._disabled.has(type)) {
			return;
		}
		if (type === StatusType.UNKNOWN) {
			return;
		}
		if (!this._statusWrappers.has(type)) {
			console.error("Error: %s was not initialized", StatusType[type]);
			return;
		}
		if (!StatusHandler._priority.has(type)) {
			console.error("Error: %s status missing priority", StatusType[type]);
			return;
		}
		if (StatusHandler._priority.get(type) < StatusHandler._priority.get(this._permanent)) {
			return;
		}

		let wrapper = this._statusWrappers.get(type);

		if (this._permanent !== type) {
			switch (type) {
			case StatusType.LOADING:
				wrapper.setText("Loading...");
				break;
			case StatusType.SETUP:
				wrapper.setText("Waiting for all players to be ready...");
				break;
			case StatusType.SPECTATING:
				wrapper.setHTML("Spectating\r\nPress " + KeyNames.kbd(settings.leftKeyCode) + " or " + KeyNames.kbd(settings.rightKeyCode) + " to change players");
				break;
			case StatusType.LOBBY:
				if (game.isHost()) {
					wrapper.setText("Invite your friends!\r\nRoom: " + game.netcode().room());
				} else {
					wrapper.setText("Waiting for host to start a game...\r\nRoom: " + game.netcode().room());
				}
				break;
			}
			this.clearStatus(this._permanent);
		}

		this._permanent = type;
		if (StatusHandler._priority.get(this._permanent) === PriorityType.HIGH) {
			wrapper.show();
		} else if (this._temporary === TempStatusType.UNKNOWN) {
			wrapper.show();
		}
	}

	showTempStatus(type : TempStatusType) : void {
		if (this._disabledTemp.has(type)) {
			return;
		}
		if (!this._tempStatusWrappers.has(type)) {
			console.error("Error: %s was not initialized", TempStatusType[type]);
			return;
		}
		if (!StatusHandler._ttl.has(type)) {
			console.error("Error: %s status missing priority or TTL", TempStatusType[type]);
			return;
		}

		let wrapper = this._tempStatusWrappers.get(type);
		if (this._temporary !== type) {
			switch (type) {
			case TempStatusType.DEGRADED:
				wrapper.setHTML("Your game is running slowly\r\nPress " + KeyNames.kbd(settings.menuKeyCode) + " to adjust your settings");
				break;
			case TempStatusType.HOST_DEGRADED:
				wrapper.setText("Your host is currently lagging or tabbed out");
				break;
			case TempStatusType.DISCONNECTED_SIGNALING:
				wrapper.setText("Lost connection to matchmaking server\r\nNo new players can join");
				break;
			case TempStatusType.KEYS:
				wrapper.setHTML(
					"Use " + KeyNames.kbd(settings.leftKeyCode) + " and " + KeyNames.kbd(settings.rightKeyCode) + " to move\r\n\r\n" +
					"Press " + KeyNames.kbd(settings.jumpKeyCode) + " to jump/double jump"
				);
				break;
			}
			this.clearTempStatus(this._temporary);
		}

		this._temporary = type;
		if (StatusHandler._priority.get(this._permanent) !== PriorityType.HIGH) {
			this.hideStatus(this._permanent);
		}
		wrapper.show(StatusHandler._ttl.get(type), () => {
			this._temporary = TempStatusType.UNKNOWN;
			this.showStatus(this._permanent);
		});
	}

	private hideStatus(type : StatusType) : void {
		if (!this._statusWrappers.has(type)) {
			return;
		}
		this._statusWrappers.get(type).hide();
	}
	clearStatus(type : StatusType) : void {
		this.hideStatus(type);
		if (this._permanent === type) {
			this._permanent = StatusType.UNKNOWN;
		}
	}

	private hideTempStatus(type : TempStatusType) : void {
		if (!this._tempStatusWrappers.has(type)) {
			return;
		}

		this._tempStatusWrappers.get(type).hide();
	}
	clearTempStatus(type : TempStatusType) : void {
		if (this._temporary === type) {
			this._temporary = TempStatusType.UNKNOWN;
			this.showStatus(this._permanent);
		}
	}
}