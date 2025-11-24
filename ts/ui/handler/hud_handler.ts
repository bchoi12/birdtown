
import { game } from 'game'

import { ui } from 'ui'
import { HudType, HudOptions } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HudBlockWrapper } from 'ui/wrapper/hud_block_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'

enum PositionType {
	UNKNOWN,

	LEFT,
	CENTER,
	RIGHT,
}

export class HudHandler extends HandlerBase implements Handler {

	private static readonly _vignetteTransition = `background-color 0.3s linear`;

	private static readonly _icons = new Map<HudType, IconType>([
		[HudType.BACKFLIP, IconType.BACKFLIP],
		[HudType.BOOSTER, IconType.ROCKET_LAUNCH],
		[HudType.BULLETS, IconType.GATLING],
		[HudType.CHARGE, IconType.BATTERY_FULL],
		[HudType.DASH, IconType.DASH],
		[HudType.GOLDEN, IconType.MONEY],
		[HudType.HEADPHONES, IconType.HEADPHONES],
		[HudType.HEALTH, IconType.HEART],
		[HudType.JETPACK, IconType.JET],
		[HudType.JUICE, IconType.TELEKENESIS],
		[HudType.MOUSE_LOCK, IconType.LOCK],
		[HudType.ORBS, IconType.ORBS],
		[HudType.POCKET_ROCKET, IconType.ROCKET],
		[HudType.ROCKET, IconType.ROCKET],
		[HudType.ROLL, IconType.ROLL],
		[HudType.SPRAY, IconType.SPRAY],
		[HudType.SQUAWK, IconType.MUSIC_NOTE],
		[HudType.STAR, IconType.STAR],
		[HudType.SWORDS, IconType.SWORDS],
		[HudType.TORNADO, IconType.TORNADO],
	]);

	private static readonly _chargingIcons = new Map<HudType, IconType>([
		[HudType.CHARGE, IconType.BATTERY_ERROR],
		[HudType.MOUSE_LOCK, IconType.UNLOCK],
	]);

	private static readonly _leftBlocks = new Set([HudType.HEALTH]);
	private static readonly _rightBlocks = new Set([HudType.BULLETS, HudType.GOLDEN, HudType.ORBS, HudType.ROCKET, HudType.SPRAY, HudType.STAR, HudType.SWORDS]);

	private _hudElm : HTMLElement;
	private _sectionsElm : HTMLElement;
	private _leftElm : HTMLElement;
	private _centerElm : HTMLElement;
	private _rightElm : HTMLElement;
	private _nameWrapper : NameWrapper;
	private _blocks : Map<HudType, HudBlockWrapper>;

	private _underwater : boolean;
	private _vignetteElm : HTMLElement;

	constructor() {
		super(HandlerType.HUD);

		this._hudElm = Html.elm(Html.divHud);
		this._sectionsElm = Html.elm(Html.divHudSections);
		this._leftElm = Html.elm(Html.divHudLeft);
		this._centerElm = Html.elm(Html.divHudCenter);
		this._rightElm = Html.elm(Html.divHudRight);

		this._nameWrapper = new NameWrapper();

		const nameElm = Html.elm(Html.divHudName);
		nameElm.appendChild(this._nameWrapper.elm());

		this._blocks = new Map();

		this._underwater = false;
		this._vignetteElm = Html.elm(Html.divVignette);
		this._vignetteElm.style.transition = HudHandler._vignetteTransition;
	}

	override reset() : void {
		super.reset();

		this._blocks.forEach((wrapper : HudBlockWrapper, type : HudType) => {
			this.remove(type);
		});
	}

	override setVisible(visible : boolean) : void {
		super.setVisible(visible);

		if (visible) {
			this._hudElm.style.display = "block";
		} else {
			this._hudElm.style.display = "none";
		}
	}

	setClientId(clientId : number) : void {
		this._nameWrapper.setClientId(clientId);

		// Don't really like this
		/*
		if (game.tablets().hasTablet(clientId)) {
			this._blocks.forEach((wrapper : HudBlockWrapper) => {
				wrapper.setColor(game.tablet(clientId).color());
			});
		}
		*/
	}
	refreshColor() : void {
		this._nameWrapper.refresh();
	}

	updateHud(blocks : Map<HudType, HudOptions>) : void {
		let currentTypes = new Set<HudType>();
		blocks.forEach((options : HudOptions, type : HudType) => {
			let block = this.getOrAddBlock(type);

			block.setCharging(options.charging);
			block.setPercent(1 - options.percentGone);

			if (!options.empty) {
				block.setText("" + Math.ceil(options.count));
			}

			if (options.keyType) {
				block.setKeyType(options.keyType);
			} else if (options.keyLives) {
				block.setLives(options.keyLives);
			} else {
				block.clearKey();
			}

			currentTypes.add(type);
		});
		this.removeOthers(currentTypes);

		this._sectionsElm.style.visibility = "visible";
	}
	hideHud() : void {
		this._sectionsElm.style.visibility = "hidden";
	}

	flashScreen(color : string, millis : number) : void {
		this._vignetteElm.style.transition = HudHandler._vignetteTransition;
		this._vignetteElm.style.boxShadow = `inset 0 0 3em ${color}`;

		// Flush CSS
		this._vignetteElm.offsetHeight;

		this._vignetteElm.style.transition = `box-shadow ${millis}ms linear, ${HudHandler._vignetteTransition}`;
		this._vignetteElm.style.boxShadow = `inset 0 0 0em ${color}`;

		// Flush CSS
		this._vignetteElm.offsetHeight;
	}

	// TODO: blend colors together to do multiple screen effects (fire, water, poison, cool)
	setCool(cool : boolean) : void {

	}
	setUnderwater(underwater : boolean) : void {
		if (this._underwater === underwater) {
			return;
		}
		this._underwater = underwater;

		if (this._underwater) {
			this._vignetteElm.style.backgroundColor = "rgba(146, 223, 247, 0.75)";
		} else {
			this._vignetteElm.style.backgroundColor = "";
		}
	}

	private getOrAddBlock(type : HudType) : HudBlockWrapper {
		if (this._blocks.has(type)) {
			return this._blocks.get(type);
		}

		let wrapper = new HudBlockWrapper();

		if (HudHandler._icons.has(type)) {
			wrapper.setIcon(HudHandler._icons.get(type));
		} else {
			console.error("Warning: missing icon for %s", HudType[type]);
		}

		if (HudHandler._chargingIcons.has(type)) {
			wrapper.setChargingIcon(HudHandler._chargingIcons.get(type));
		}

		this._blocks.set(type, wrapper);

		if (HudHandler._leftBlocks.has(type)) {
			this._leftElm.appendChild(wrapper.elm());
		} else if (HudHandler._rightBlocks.has(type)) {
			this._rightElm.appendChild(wrapper.elm());
		} else {
			this._centerElm.appendChild(wrapper.elm());
		}

		return wrapper;
	}

	private removeOthers(types : Set<HudType>) : void {
		this._blocks.forEach((wrapper : HudBlockWrapper, type : HudType) => {
			if (!types.has(type)) {
				this.remove(type);
			}
		});
	}

	private remove(type : HudType) : void {
		if (!this._blocks.has(type)) {
			return;
		}

		let wrapper = this._blocks.get(type);
		wrapper.elm().parentNode.removeChild(wrapper.elm());
		this._blocks.delete(type);
	}
}