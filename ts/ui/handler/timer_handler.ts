
import { game } from 'game'
import { GameState } from 'game/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { InfoType, UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

import { Optional } from 'util/optional'

export class TimerHandler extends HandlerBase implements Handler {

	private _seconds : number;
	private _timerElm : HTMLElement;
	private _timerId : Optional<number>;

	constructor() {
		super(HandlerType.SCOREBOARD);

		this._seconds = 0;
		this._timerElm = Html.elm(Html.divTimer);
		this._timerId = new Optional();
	}

	setTimer(millis : number) : void {
		
	}
}