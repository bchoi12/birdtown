
import { ui } from 'ui'
import { HudType, HudOptions } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'
import { ProgressWrapper } from 'ui/wrapper/progress_wrapper'

export class HudBlockWrapper extends HtmlWrapper<HTMLElement> {

	private _iconType : IconType;
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

		this._iconType = IconType.UNKNOWN;
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
	}

	setIcon(type : IconType) : void {
		if (this._iconType === type) {
			return;
		}

		Icon.change(this._iconElm, type);
		this._iconType = type;
	}

	setCharging(charging : boolean) : void {
		if (charging) {
			this._blockElm.classList.add(Html.classHudBlockCharging);
		} else {
			this._blockElm.classList.remove(Html.classHudBlockCharging);
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