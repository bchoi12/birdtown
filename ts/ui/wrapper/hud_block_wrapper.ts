
import { ui } from 'ui'
import { HudType, HudOptions } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'
import { ProgressWrapper } from 'ui/wrapper/progress_wrapper'

export class HudBlockWrapper extends HtmlWrapper<HTMLElement> {

	private _charging : boolean;
	private _iconType : IconType;
	private _chargingIconType : IconType;
	private _lives : number;
	private _width : number;

	private _containerElm : HTMLElement;

	private _blockElm : HTMLElement;
	private _iconElm : HTMLElement;
	private _textElm : HTMLElement;
	private _keyElm : HTMLElement;

	private _progressWrapper : ProgressWrapper;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classHudContainer);

		this._charging = false;
		this._iconType = IconType.UNKNOWN;
		this._chargingIconType = IconType.UNKNOWN;
		this._lives = 0;
		this._width = 0;

		this._blockElm = Html.div();
		this._blockElm.classList.add(Html.classHudBlock);
		this.elm().appendChild(this._blockElm);

		this._iconElm = Icon.baseElement();
		this._blockElm.appendChild(this._iconElm);

		this._textElm = Html.div();
		this._textElm.classList.add(Html.classHudText);
		this._blockElm.appendChild(this._textElm);

		this._keyElm = Html.div();
		this._keyElm.classList.add(Html.classHudKey);
		this.elm().appendChild(this._keyElm);

		this._progressWrapper = new ProgressWrapper();
		this.elm().appendChild(this._progressWrapper.elm());

		addEventListener("resize", (e) => {
			this._width = 0;
			this.elm().style.minWidth = "0";
		});
	}

	setIcon(type : IconType) : void {
		if (this._iconType === type) {
			return;
		}

		Icon.change(this._iconElm, type);
		this._iconType = type;
	}

	setChargingIcon(type : IconType) : void {
		if (this._chargingIconType === type) {
			return;
		}

		this._chargingIconType = type;
	}

	setCharging(charging : boolean) : void {
		if (this._charging === charging) {
			return;
		}

		this._charging = charging;

		if (this._charging) {
			if (this._chargingIconType !== IconType.UNKNOWN) {
				Icon.change(this._iconElm, this._chargingIconType);
			}

			this._blockElm.classList.add(Html.classHudBlockCharging);
			this.elm().classList.add(Html.classHudContainerCharging);
		} else {
			if (this._chargingIconType !== IconType.UNKNOWN) {
				Icon.change(this._iconElm, this._iconType);
			}

			this._blockElm.classList.remove(Html.classHudBlockCharging);
			this.elm().classList.remove(Html.classHudContainerCharging);
		}
	}

	setPercent(percent : number) : void {
		this._progressWrapper.setPercent(percent);
	}

	setColor(color : string) : void {
		this._progressWrapper.setColor(color);
	}

	setKeyHTML(html : string) : void {
		this._keyElm.innerHTML = html;
	}

	setLives(lives : number) : void {
		if (this._lives === lives) {
			return;
		}

		this._lives = lives;
		this._keyElm.innerHTML = "";
		for (let i = 0; i < this._lives; ++i) {
			this._keyElm.innerHTML += Icon.create(IconType.BIRD).outerHTML;
		}
	}

	setText(text : string) : void {
		this._textElm.textContent = text;

		if (text.length === 0) {
			this._textElm.style.paddingLeft = "0";
			if (this._width > 0) {
				this._width = 0;
				this.elm().style.minWidth = "0";
			}
		} else {
			this._textElm.style.paddingLeft = "0.3em";

			if (this.elm().offsetWidth > this._width) {
				this._width = this.elm().offsetWidth;
				this.elm().style.minWidth = this._width + "px";
			}
		}
	}
}