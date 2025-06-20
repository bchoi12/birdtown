
import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

export class NameInputWrapper extends HtmlWrapper<HTMLElement> {

	private _defaultName : string;
	private _nameElm : HTMLInputElement;

	constructor(defaultName : string) {
		super(Html.div());

		this._defaultName = defaultName;

		this._nameElm = Html.input();
		this._nameElm.placeholder = this._defaultName;
		this._nameElm.style.width = "80%";
		this._nameElm.maxLength = 16;
		this.elm().appendChild(this._nameElm);
	}

	setPlaceholder(name : string) : void {
		this._defaultName = name;
		this._nameElm.value = "";
		this._nameElm.placeholder = this._defaultName;
	}
	nameElm() : HTMLInputElement { return this._nameElm; }
	name() : string { return this._nameElm.value.length > 0 ? this._nameElm.value : this._defaultName; }
}