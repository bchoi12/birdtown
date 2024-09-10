
import { game } from 'game'

import { ui } from 'ui'
import { StatusType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { StatusWrapper } from 'ui/wrapper/status_wrapper'

export class StatusHandler extends HandlerBase implements Handler {

	// Statuses to clear when displayed
	private static readonly _clear = new Map<StatusType, Set<StatusType>>([
		[StatusType.DISCONNECTED, new Set([StatusType.DISCONNECTED_SIGNALING, StatusType.LOBBY])],
		[StatusType.DISCONNECTED_SIGNALING, new Set([StatusType.LOBBY])],
		[StatusType.LOBBY, new Set()],
	]);

	private _statusElm : HTMLElement;
	private _statusWrappers : Map<StatusType, StatusWrapper>;
	private _current : Set<StatusType>;

	constructor() {
		super(HandlerType.STATUS);

		this._statusElm = Html.elm(Html.divStatus);
		this._statusWrappers = new Map();
		this._current = new Set();
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

	showStatus(type : StatusType) : void {
		if (!this._statusWrappers.has(type)) {
			return;
		}

		let valid = true;
		this._current.forEach((currentType : StatusType) => {
			if (!StatusHandler._clear.has(currentType)) {
				console.error("Error: missing clear map for", StatusType[currentType]);
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
		case StatusType.DISCONNECTED:
			wrapper.setText("Disconnected from the server.\r\nPlease refresh the page.");
			break;
		case StatusType.DISCONNECTED_SIGNALING:
			wrapper.setText("Lost connection to matchmaking server.\r\nNo new players can join.");
			break;
		case StatusType.LOBBY:
			wrapper.setText("Birdtown Lobby\r\nRoom: " + game.netcode().room());
			break;
		}

		wrapper.show();
		this._current.add(type);
		this.hideStatus(...StatusHandler._clear.get(type));
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