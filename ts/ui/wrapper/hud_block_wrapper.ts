
import { ui } from 'ui'
import { HudType, HudOptions } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'
import { ProgressWrapper } from 'ui/wrapper/progress_wrapper'

export class HudBlockWrapper extends HtmlWrapper<HTMLElement> {

	private _iconType : IconType;

	private _containerElm : HTMLElement;

	private _blockElm : HTMLElement;
	private _iconElm : HTMLElement;
	private _textElm : HTMLElement;

	private _progressWrapper : ProgressWrapper;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classHudContainer);

		this._iconType = IconType.UNKNOWN;

		this._blockElm = Html.div();
		this._blockElm.classList.add(Html.classHudBlock);
		this.elm().appendChild(this._blockElm);

		this._iconElm = Icon.baseElement();
		this._blockElm.appendChild(this._iconElm);

		this._textElm = Html.span();
		this._blockElm.appendChild(this._textElm);

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

	setText(text : string) : void {
		this._textElm.textContent = text;

		if (text.length === 0) {
			this._textElm.style.paddingLeft = "0";
		} else {
			this._textElm.style.paddingLeft = "0.3em";
		}
	}
}