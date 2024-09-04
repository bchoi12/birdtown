
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { TooltipType, TooltipOptions, UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { KeyNames } from 'ui/common/key_names'
import { TooltipWrapper } from 'ui/wrapper/tooltip_wrapper'

import { defined } from 'util/common'

export class TooltipHandler extends HandlerBase implements Handler {

	private static readonly _nonGameTypes = new Set([
		TooltipType.COPIED_URL,
	]);

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
	showTooltip(type : TooltipType, options : TooltipOptions) : void {
		if (ui.mode() !== UiMode.GAME && !TooltipHandler._nonGameTypes.has(type)) {
			return;
		}

		const html = this.getHtml(type, options);
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
		if (options.ttl) {
			wrapper.setTTL(options.ttl, () => {
				this._tooltips.delete(type);
			});
		}
	}
	hideTooltip(type : TooltipType) : void {
		if (!this._tooltips.has(type)) {
			return;
		}

		this._tooltips.get(type).delete(() => {
			this._tooltips.delete(type);
		});
	}

	private getHtml(type : TooltipType, options : TooltipOptions) : string {
		const names = options.names ? options.names : [];
		switch (type) {
		case TooltipType.CONTROLS:
			return KeyNames.boxed(settings.interactKeyCode) + " View the controls";
		case TooltipType.COPIED_URL:
			return "Copied URL to clipboard!";
		case TooltipType.FAILED_DIALOG_SYNC:
			return "Error: failed to save dialog input!";
		case TooltipType.JUST_A_SIGN:
			return "Just a sign...nothing to see here"
		case TooltipType.HEALTH_CRATE:
			if (names.length !== 1) {
				return "";
			}
			return KeyNames.boxed(settings.interactKeyCode) + " Recover " + names[0] + " health";
		case TooltipType.SPAWN:
			return "Press [any key] to deploy"
		case TooltipType.SPECTATING:
			if (names.length > 1) {
				return "";
			}
			return "Spectating" + (names.length === 1 ? " " + names[0] : "");
		case TooltipType.START_GAME:
			if (!game.isHost()) {
				return "Only the host can start a game";
			}
			return KeyNames.boxed(settings.interactKeyCode) + " Start a game";
		case TooltipType.WEAPON_CRATE:
			if (names.length !== 1) {
				return "";
			}
			return KeyNames.boxed(settings.interactKeyCode) + " Equip " + names[0];
		default:
			return "Missing tooltip text for type " + type;
		}
	}
}