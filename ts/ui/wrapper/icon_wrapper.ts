
import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

export class IconWrapper extends HtmlWrapper<HTMLElement> {

	private _iconElm : HTMLElement;
	private _contentElm : HTMLElement;

	constructor() {
		super(Html.span());

		this._iconElm = Html.span();
		this._contentElm = Html.span();

		this.elm().appendChild(this._iconElm);
		this.elm().appendChild(this._contentElm);
	}

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

	setText(text : string) : void {
		if (text.length === 0) {
			this._contentElm.style.paddingLeft = "";
		} else {
			this._contentElm.style.paddingLeft = "0.3em";
		}

		this._contentElm.textContent = text;
	}
	setHTML(html : string) : void {
		if (html.length === 0) {
			this._contentElm.style.paddingLeft = "";
		} else {
			this._contentElm.style.paddingLeft = "0.3em";
		}

		this._contentElm.innerHTML = html;
	}
}