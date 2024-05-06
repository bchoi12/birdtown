
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
		super.reset();

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

		const html = this.getHtml(msg);
		if (html.length === 0) {
			console.error("Error: not showing empty tooltip ", TooltipType[type]);
			return;
		}

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


		wrapper.elm().innerHTML = html;
		wrapper.setTTL(ttl, () => {
			this._tooltips.delete(type);
		});
	}

	private getHtml(msg : UiMessage) : string {
		const type = msg.getTooltipType();
		const names = msg.getNamesOr([]);
		switch (type) {
		case TooltipType.CONTROLS:
			return KeyNames.boxed(settings.interactKeyCode) + " View the controls";
		case TooltipType.COPIED_URL:
			return "Copied URL to clipboard!";
		case TooltipType.FAILED_DIALOG_SYNC:
			return "Error: failed to save dialog input!";
		case TooltipType.JUST_A_SIGN:
			return "Just a sign...nothing to see here"
		case TooltipType.OPEN_CRATE:
			if (names.length !== 1) {
				return "";
			}
			return KeyNames.boxed(settings.interactKeyCode) + " Equip " + names[0];
		case TooltipType.SPAWN:
			return "Press [any key] to deploy"
		case TooltipType.SPECTATING:
			if (names.length !== 1) {
				return "";
			}
			return "Spectating " + names[0];
		case TooltipType.START_GAME:
			if (!game.isHost()) {
				return "When you\'re ready, ask the host to start a game";
			}
			return KeyNames.boxed(settings.interactKeyCode) + " Start a game";
		default:
			return "Missing tooltip text for type " + type;
		}
	}
}