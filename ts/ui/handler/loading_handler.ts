
import { game } from 'game'
import { GameState } from 'game/api'

import { ui } from 'ui'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

import { Optional } from 'util/optional'

export class LoadingHandler extends HandlerBase implements Handler {

	private static readonly _hideBuffer = 500;
	private static readonly _showBuffer = 500;

	private _loadingElm : HTMLElement;
	private _loading : boolean;
	private _timeoutId : Optional<number>;
	private _initialized : boolean;

	constructor() {
		super(HandlerType.LOADING);

		this._loadingElm = Html.elm(Html.divLoading);
		this._loading = false;
		this._timeoutId = new Optional();
		this._initialized = false;
	}

	override onGameInitialized() : void {
		super.onGameInitialized();

		this._loadingElm.style.display = "block";
		this.setLoading(false);
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		this._initialized = true;
	}

	setGameState(state : GameState) : void {
		if (!this._initialized) {
			return;
		}

		switch (state) {
		case GameState.PRELOAD:
		case GameState.VICTORY:
		case GameState.END:
		case GameState.ERROR:
			const timeLimit = game.controller().timeLimit(state);
			this.setLoadingAfter(true, timeLimit - LoadingHandler._hideBuffer);
			break;
		default:
			this.setLoadingAfter(false, LoadingHandler._showBuffer);
		}
	}

	private refresh() : void {
		if (this._loading) {
			this._loadingElm.style.left = "0";
		} else {
			this._loadingElm.style.left = "-170%";
		}
	}

	private setLoading(loading : boolean) : void {
		this.setLoadingAfter(loading, 0);
	}

	private setLoadingAfter(loading : boolean, millis : number) : void {
		if (this._timeoutId.has()) {
			window.clearTimeout(this._timeoutId.get());
		}

		if (this._loading === loading) {
			return;
		}
		this._loading = loading;

		if (millis > 0) {
			this._timeoutId.set(window.setTimeout(() => {
				this.refresh();
			}, millis));
		} else {
			this.refresh();
		}
	} 
}