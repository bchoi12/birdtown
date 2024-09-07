
import { game } from 'game'

import { ui } from 'ui'
import { CounterType, CounterOptions, StatusType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { StatusWrapper } from 'ui/wrapper/status_wrapper'

export class StatusHandler extends HandlerBase implements Handler {

	private _statusElm : HTMLElement;
	private _statusWrappers : Map<StatusType, StatusWrapper>;

	constructor() {
		super(HandlerType.STATUS);

		this._statusElm = Html.elm(Html.divStatus);
		this._statusWrappers = new Map();
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
	}

	showStatus(type : StatusType) : void {
		if (!this._statusWrappers.has(type)) {
			return;
		}

		let wrapper = this._statusWrappers.get(type);
		switch (type) {
		case StatusType.DISCONNECTED:
			wrapper.setText("Disconnected from the server.\r\nPlease refresh the page.");
			this.hideStatus(StatusType.DISCONNECTED_SIGNALING, StatusType.LOBBY);
			break;
		case StatusType.DISCONNECTED_SIGNALING:
			wrapper.setText("Lost connection to matchmaking server.\r\nNo new players can join.");
			this.hideStatus(StatusType.LOBBY);
			break;
		case StatusType.LOBBY:
			wrapper.setText("Birdtown Lobby\r\nRoom: " + game.netcode().room());
			break;
		}

		wrapper.show();
	}

	hideStatus(...types : StatusType[]) : void {
	    for (let i = 0; i < types.length; ++i) {
			if (!this._statusWrappers.has(types[i])) {
				return;
			}

			this._statusWrappers.get(types[i]).hide();
	    }
	}
}