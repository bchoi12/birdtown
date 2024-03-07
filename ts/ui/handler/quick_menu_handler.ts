
import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'

export class QuickMenuHandler extends HandlerBase implements Handler {
	private _quickMenuElm : HTMLElement;
	private _applyButtonElm : HTMLInputElement;

	constructor() {
		super(HandlerType.QUICK_MENU);

		this._quickMenuElm = Html.elm(Html.divQuickMenu);
	}

	override setup() : void {
		
	}

	override setMode(mode : UiMode) : void {

	}
}