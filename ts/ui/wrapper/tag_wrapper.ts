
import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

export class TagWrapper extends HtmlWrapper<HTMLElement> {

	private _iconElm : HTMLElement;
	private _nameElm : HTMLElement;

	constructor() {
		super(Html.span());

		this.elm().classList.add(Html.classDisplayName);

		this._iconElm = Html.span();
		this._nameElm = Html.span();

		this.elm().appendChild(this._iconElm);
		this.elm().appendChild(this._nameElm);

		this.elm().style.display = "none";
	}

	clearIcon() : void { this._iconElm.innerHTML = ""; }
	setIcon(type : IconType) : void {
		if (type === IconType.UNKNOWN) {
			this._iconElm.innerHTML = "";
			return;
		}

		let icon = Icon.create(type);
		icon.style.padding = "0 0.3em 0.1em 0";
		this._iconElm.appendChild(icon);
	}

	setName(name : string) : void {
		this._nameElm.textContent = name;

		if (name.length === 0) {
			this.elm().style.display = "none";
		} else {
			this.elm().style.display = "revert";
		}
	}
	name() : string { return this._nameElm.textContent; }

	setBackgroundColor(color : string) : void {
		this.elm().style.backgroundColor = color;
	}
}