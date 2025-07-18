
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, TooltipType, TooltipOptions, UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { Icon, IconType } from 'ui/common/icon'
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

	override setVisible(visible : boolean) : void {
		super.setVisible(visible);

		if (visible) {
			this._tooltipsElm.style.visibility = "visible";
		} else {
			this._tooltipsElm.style.visibility = "hidden";
		}
	}

	showTooltip(type : TooltipType, options : TooltipOptions) : void {
		if (ui.mode() !== UiMode.GAME && !TooltipHandler._nonGameTypes.has(type)) {
			return;
		}

		if (!this.visible()) {
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
		case TooltipType.BEING_REVIVED:
			if (names.length === 1) {
				return `${names[0]} is reviving you...`;
			} else if (names.length === 2) {
				return `${names[0]} is reviving you...${names[1]}%`;
			}
			return "Reviving...";
		case TooltipType.BUBBLE:
			return `Press ${KeyNames.keyTypeHTML(KeyType.JUMP)} to pop the bubble`;
		case TooltipType.CONTROLS:
			return `${Icon.string(IconType.SIGN)} Press ${KeyNames.keyTypeHTML(KeyType.MENU)} at any time to update settings & controls`;
		case TooltipType.COPIED_URL:
			return "Copied invite link to clipboard!";
		case TooltipType.FORCE_SUBMIT:
			return "Dialog was auto-submitted!";
		case TooltipType.JUST_A_SIGN:
			return `${Icon.string(IconType.SIGN)} Just a sign with no purpose`
		case TooltipType.HEALTH_CRATE:
			if (names.length !== 1) {
				return "";
			}
			return `Press ${KeyNames.keyTypeHTML(KeyType.INTERACT)} to recover ${names[0]} health`;
		case TooltipType.HIKING_SWIM:
			return `${Icon.string(IconType.WARNING)} No lifeguard on duty! ${Icon.string(IconType.WARNING)}\nSwim at your own risk`
		case TooltipType.HIKING_NIGHT:
			return `${Icon.string(IconType.WARNING)} Freezing temperatures at the lake tonight! ${Icon.string(IconType.WARNING)}`			
		case TooltipType.MUSIC:
			if (names.length !== 1) {
				return "";
			}
			return "🎵 Now Playing 🎵\n" + names[0];
		case TooltipType.POINTER_LOCK:
			return `Press ${KeyNames.keyTypeHTML(KeyType.POINTER_LOCK)} to unlock your mouse`;
		case TooltipType.REMATCH:
			return `${Icon.string(IconType.SIGN)} Press ${KeyNames.keyTypeHTML(KeyType.INTERACT)} for a rematch!`
		case TooltipType.REMATCH_FAILED:
			return `Failed to start the rematch! This is likely due to players changing.\nYou can still start a game manually.`
		case TooltipType.REVIVE:
			if (names.length !== 1) {
				return `Press ${KeyNames.keyTypeHTML(KeyType.INTERACT)} to start reviving your teammate`;
			}
			return `Press ${KeyNames.keyTypeHTML(KeyType.INTERACT)} to start reviving ${names[0]}`;
		case TooltipType.REVIVING:
			if (names.length === 1) {
				return `Reviving ${names[0]}...`;
			} else if (names.length === 2) {
				return `Reviving ${names[0]}...${names[1]}%`;
			}
			return "Reviving your teammate";
		case TooltipType.SPAWN:
			return "Press <kbd>any key</kbd> to deploy"
		case TooltipType.START_GAME:
			if (!game.isHost()) {
				return `${Icon.string(IconType.SIGN)} Press ${KeyNames.keyTypeHTML(KeyType.INTERACT)} to view game modes\nOnly the host can start a game`;
			}
			return `${Icon.string(IconType.SIGN)} Press ${KeyNames.keyTypeHTML(KeyType.INTERACT)} to start a new game!`;
		case TooltipType.WEAPON_CRATE:
			if (names.length !== 1) {
				return "";
			}
			return `Press ${KeyNames.keyTypeHTML(KeyType.INTERACT)} to equip ${names[0]}`;
		default:
			return "Missing tooltip text for type " + TooltipType[type];
		}
	}
}