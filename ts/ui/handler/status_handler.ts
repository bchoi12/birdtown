
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { StatusType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { StatusWrapper } from 'ui/wrapper/status_wrapper'

export class StatusHandler extends HandlerBase implements Handler {

	// Statuses to clear when displayed
	private static readonly _clear = new Map<StatusType, Set<StatusType>>([
		[StatusType.DISCONNECTED, new Set([StatusType.DISCONNECTED_SIGNALING, StatusType.HOST_DEGRADED, StatusType.LOADING, StatusType.SPECTATING, StatusType.SETUP, StatusType.LOBBY])],
		[StatusType.DISCONNECTED_SIGNALING, new Set([StatusType.LOBBY])],
		[StatusType.HOST_DEGRADED, new Set([StatusType.DEGRADED])],
		[StatusType.LOADING, new Set([StatusType.LOBBY, StatusType.WELCOME])],
		[StatusType.LOBBY, new Set([StatusType.WELCOME])],
		[StatusType.SETUP, new Set([StatusType.LOADING])],
	]);

	private _statusElm : HTMLElement;
	private _statusWrappers : Map<StatusType, StatusWrapper>;
	private _current : Set<StatusType>;
	private _disabled : Set<StatusType>;

	constructor() {
		super(HandlerType.STATUS);

		this._statusElm = Html.elm(Html.divStatus);
		this._statusWrappers = new Map();
		this._current = new Set();
		this._disabled = new Set();
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
	}

	override reset() : void {
		super.reset();

		for (const stringStatus in StatusType) {
			const type = Number(StatusType[stringStatus]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			this.hideStatus(type);
		}
	}

	hasStatus(type : StatusType) : boolean { return this._current.has(type); }
	disableStatus(type : StatusType) : void {
		this.hideStatus(type);
		this._disabled.add(type);
	}

	showStatus(type : StatusType) : void {
		if (!this._statusWrappers.has(type)) {
			console.error("Error: %s was not initialized", StatusType[type]);
			return;
		}
		if (this._disabled.has(type)) {
			return;
		}

		let valid = true;
		this._current.forEach((currentType : StatusType) => {
			if (!StatusHandler._clear.has(currentType)) {
				return;
			}

			if (StatusHandler._clear.get(currentType).has(type)) {
				valid = false;
			}
		});

		if (!valid) {
			return;
		}

		let wrapper = this._statusWrappers.get(type);
		switch (type) {
		case StatusType.DEGRADED:
			wrapper.setHTML("Your game is running slowly\r\nPress " + KeyNames.kbd(settings.menuKeyCode) + " to adjust your settings");
			break;
		case StatusType.HOST_DEGRADED:
			wrapper.setText("Your host is currently lagging or tabbed out");
			break;
		case StatusType.DISCONNECTED:
			wrapper.setText("Disconnected from host\r\nPlease quit the game and rejoin");
			break;
		case StatusType.DISCONNECTED_SIGNALING:
			wrapper.setText("Lost connection to matchmaking server\r\nNo new players can join");
			break;
		case StatusType.LOADING:
			wrapper.setText("Loading...");
			break;
		case StatusType.LOBBY:
			if (game.isHost()) {
				wrapper.setText("Invite your friends!\r\nRoom: " + game.netcode().room());
			} else {
				wrapper.setText("Waiting for host to start a game...\r\nRoom: " + game.netcode().room());
			}
			break;
		case StatusType.SETUP:
			wrapper.setText("Waiting for all players to be ready...");
			break;
		case StatusType.SPECTATING:
			wrapper.setHTML("Spectating\r\nPress " + KeyNames.kbd(settings.leftKeyCode) + " or " + KeyNames.kbd(settings.rightKeyCode) + " to change players");
			break;
		case StatusType.WELCOME:
			wrapper.setHTML(
				"Use " + KeyNames.kbd(settings.leftKeyCode) + " and " + KeyNames.kbd(settings.rightKeyCode) + " to move\r\n\r\n" +
				"Press " + KeyNames.kbd(settings.jumpKeyCode) + " to jump/double jump"
			);
			break;
		}

		wrapper.show();
		this._current.add(type);

		if (StatusHandler._clear.has(type)) {
			this.hideStatus(...StatusHandler._clear.get(type));
		}
	}

	hideStatus(...types : StatusType[]) : void {
	    for (let i = 0; i < types.length; ++i) {
			if (!this._statusWrappers.has(types[i])) {
				return;
			}

			this._statusWrappers.get(types[i]).hide();
			this._current.delete(types[i]);
	    }
	}
}