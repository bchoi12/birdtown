

import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { TooltipType, UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { KeyNames } from 'ui/util/key_names'
import { TooltipWrapper } from 'ui/wrapper/tooltip_wrapper'

import { defined } from 'util/common'

export class TooltipHandler extends HandlerBase implements Handler {

	private static readonly _defaultTTL : number = 2000;
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

		const type = msg.getProp<TooltipType>(UiProp.TYPE);
		const ttl = msg.getPropOr<number>(UiProp.TTL, TooltipHandler._defaultTTL);

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
		const type = msg.getProp<TooltipType>(UiProp.TYPE);
		const names = msg.getPropOr<Array<string>>(UiProp.NAMES, []);
		switch (type) {
		case TooltipType.CONSOLE:
			return "Press " + KeyNames.boxed(settings.interactKeyCode) + " to start a game.";
		case TooltipType.SPECTATING:
			if (names.length !== 1) {
				return "Spectating";
			}
			return "Spectating " + names[0];
		default:
			return "Missing tooltip text for type " + type;
		}
	}
}