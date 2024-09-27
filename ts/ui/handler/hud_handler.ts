
import { ui } from 'ui'
import { HudType, HudOptions } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { KeyNames } from 'ui/common/key_names'
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

	private static readonly _icons = new Map<HudType, IconType>([
		[HudType.BOOSTER, IconType.ROCKET_LAUNCH],
		[HudType.CHARGE, IconType.BATTERY_FULL],
		[HudType.DASH, IconType.DASH],
		[HudType.BLACK_HOLE, IconType.EARTH],
		[HudType.BULLETS, IconType.GATLING],
		[HudType.HEALTH, IconType.HEART],
		[HudType.JETPACK, IconType.JET],
		[HudType.JUICE, IconType.TELEKENESIS],
		[HudType.MOUSE_LOCK, IconType.LOCK],
		[HudType.ROCKET, IconType.ROCKET],
		[HudType.ROLL, IconType.ROLL],
		[HudType.SPRAY, IconType.SPRAY],
		[HudType.SQUAWK, IconType.MUSIC_NOTE],
		[HudType.STAR, IconType.STAR],
	]);

	private static readonly _chargingIcons = new Map<HudType, IconType>([
		[HudType.CHARGE, IconType.BATTERY_ERROR],
		[HudType.MOUSE_LOCK, IconType.UNLOCK],
	]);

	private static readonly _leftBlocks = new Set([HudType.HEALTH]);
	private static readonly _rightBlocks = new Set([HudType.BULLETS, HudType.ROCKET, HudType.SPRAY, HudType.STAR]);

	private _hudElm : HTMLElement;
	private _leftElm : HTMLElement;
	private _centerElm : HTMLElement;
	private _rightElm : HTMLElement;
	private _nameWrapper : NameWrapper;
	private _blocks : Map<HudType, HudBlockWrapper>;

	constructor() {
		super(HandlerType.HUD);

		this._hudElm = Html.elm(Html.divHud);
		this._leftElm = Html.elm(Html.divHudLeft);
		this._centerElm = Html.elm(Html.divHudCenter);
		this._rightElm = Html.elm(Html.divHudRight);
		this._nameWrapper = new NameWrapper();

		const nameElm = Html.elm(Html.divHudName);
		nameElm.appendChild(this._nameWrapper.elm());

		this._blocks = new Map();
	}

	override reset() : void {
		super.reset();

		this._blocks.forEach((wrapper : HudBlockWrapper, type : HudType) => {
			this.remove(type);
		});
	}

	setClientId(clientId : number) : void {
		this._nameWrapper.setClientId(clientId);
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
				block.setKeyHTML(KeyNames.keyTypeHTML(options.keyType));
			} else if (options.keyCode) {
				block.setKeyHTML(KeyNames.kbd(options.keyCode));
			} else if (options.keyLives) {
				block.setLives(options.keyLives);
			}

			currentTypes.add(type);
		});
		this.removeOthers(currentTypes);
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