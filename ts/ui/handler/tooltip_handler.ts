
import { ui } from 'ui'
import { TooltipType, UiMode, TooltipMsg } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
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

	setup() : void {}
	reset() : void {
		this._tooltips.forEach((wrapper : TooltipWrapper, type : TooltipType) => {
			wrapper.delete(() => {
				this._tooltips.delete(type);
			});
		});
	}
	setMode(mode : UiMode) : void {}

	showTooltip(tooltip : TooltipMsg) : void {
		let wrapper;
		if (this._tooltips.has(tooltip.type)) {
			wrapper = this._tooltips.get(tooltip.type);
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
			this._tooltips.set(tooltip.type, wrapper);
			this._tooltipsElm.appendChild(wrapper.elm());
		}

		wrapper.setHtml(this.getHtml(tooltip));
		wrapper.setTTL(defined(tooltip.ttl) ? tooltip.ttl : TooltipHandler._defaultTTL, () => {
			this._tooltips.delete(tooltip.type);
		});
	}

	private getHtml(tooltip : TooltipMsg) : string{
		switch (tooltip.type) {
		default:
			return "testing 123";
		}
	}
}