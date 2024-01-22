
import { game } from 'game'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { TooltipType, UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { KeyNames } from 'ui/common/key_names'
import { TooltipWrapper } from 'ui/wrapper/tooltip_wrapper'

import { defined } from 'util/common'

export class TooltipHandler extends HandlerBase implements Handler {

	private static readonly _defaultTTL : number = 3000;
	private static readonly _maxTooltips : number = 3;

	private _tooltipsElm : HTMLElement;
	private _tooltips : Map<TooltipType, TooltipWrapper>;

	constructor() {
		super(HandlerType.TOOLTIPS);

		this._tooltipsElm = Html.elm(Html.divTooltips);
		this._tooltips = new Map();
	}

	override reset() : void {
		this._tooltips.forEach((wrapper : TooltipWrapper, type : TooltipType) => {
			wrapper.delete(() => {
				this._tooltips.delete(type);
			});
		});
	}
	override handleMessage(msg : UiMessage) : void {
		if (msg.type() !== UiMessageType.TOOLTIP) {
			return;
		}

		const type = msg.getTooltipType();
		const ttl = msg.getTtlOr(TooltipHandler._defaultTTL);

		let wrapper;
		if (this._tooltips.has(type)) {
			wrapper = this._tooltips.get(type);
		} else {
			for (let [type, activeWrapper] of this._tooltips) {
				if (this._tooltips.size < TooltipHandler._maxTooltips) {
					break;
				}

				activeWrapper.delete(() => {
					this._tooltips.delete(type);
				})
			}

			wrapper = new TooltipWrapper();
			this._tooltips.set(type, wrapper);
			this._tooltipsElm.appendChild(wrapper.elm());
		}

		wrapper.setHtml(this.getHtml(msg));
		wrapper.setTTL(ttl, () => {
			this._tooltips.delete(type);
		});
	}

	private getHtml(msg : UiMessage) : string{
		const type = msg.getTooltipType();
		const names = msg.getNamesOr([]);
		switch (type) {
		case TooltipType.FAILED_DIALOG_SYNC:
			return "Error: failed to save dialog input!";
		case TooltipType.JUST_A_SIGN:
			return "Just a sign...nothing to see here."
		case TooltipType.SPAWN:
			return "Press " + KeyNames.boxed(settings.jumpKeyCode) + " to deploy the chicken."
		case TooltipType.SPECTATING:
			if (names.length !== 1) {
				return "Spectating";
			}
			return "Spectating " + names[0];
		case TooltipType.START_GAME:
			if (!game.isHost()) {
				return "When you\'re ready, ask the host to start a game.";
			}
			return "Press " + KeyNames.boxed(settings.interactKeyCode) + " to start a game at anytime.\n(2+ players required)";
		default:
			return "Missing tooltip text for type " + type;
		}
	}
}