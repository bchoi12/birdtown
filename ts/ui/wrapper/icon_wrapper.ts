
import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

export class IconWrapper extends HtmlWrapper<HTMLElement> {

	private _iconElm : HTMLElement;
	private _textElm : HTMLElement;

	constructor() {
		super(Html.div());

		this._iconElm = Html.span();
		this._textElm = Html.span();

		this.elm().appendChild(this._iconElm);
		this.elm().appendChild(this._textElm);
	}

	protected iconElm() : HTMLElement { return this._iconElm; }
	setIcon(type : IconType) : void { this.setIcons(type); }
	setIcons(...types : IconType[]) : void {
		this._iconElm.innerHTML = "";

		for (let i = 0; i < types.length; ++i) {
			this._iconElm.appendChild(Icon.create(types[i]));
		}
	}
	setIconN(type : IconType, n : number) : void {
		this._iconElm.innerHTML = "";

		for (let i = 0; i < n; ++i) {
			this._iconElm.appendChild(Icon.create(type));
		}
	}
	setIconFraction(type : IconType, n : number, max : number) : void {
		if (n >= max) {
			this.setIconN(type, n);
			return;
		}

		this._iconElm.innerHTML = "";

		for (let i = 0; i < max; ++i) {
			let icon = Icon.create(type);

			if (i >= n) {
				icon.style.opacity = "0.3";
			}

			this._iconElm.appendChild(icon);
		}
	}

	protected textElm() : HTMLElement { return this._textElm; }
	setText(text : string) : void {
		if (text.length === 0 || this._iconElm.innerHTML === "") {
			this._textElm.style.paddingLeft = "";
		} else {
			this._textElm.style.paddingLeft = "0.3em";
		}

		this._textElm.textContent = text;
	}
	setHTML(html : string) : void {
		if (html.length === 0 || this._iconElm.innerHTML === "") {
			this._textElm.style.paddingLeft = "";
		} else {
			this._textElm.style.paddingLeft = "0.3em";
		}

		this._textElm.innerHTML = html;
	}
}