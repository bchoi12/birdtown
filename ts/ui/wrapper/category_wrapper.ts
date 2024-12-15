
import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

export class CategoryWrapper extends HtmlWrapper<HTMLElement> {

	private _titleWrapper : TitleWrapper;
	private _contentElm : HTMLElement;
	private _expanded : boolean;

	constructor() {
		super(Html.div());

		this._titleWrapper = new TitleWrapper();

		this._contentElm = Html.div();
		this._contentElm.classList.add(Html.classCategoryContent);

		this._expanded = true;

		this.elm().classList.add(Html.classCategory);
		this.elm().appendChild(this._titleWrapper.elm());
		this.elm().appendChild(this._contentElm);

		this._titleWrapper.elm().onclick = () => {
			this.setExpanded(!this._expanded);
		}
	}

	setTitle(title : string) : void {
		this._titleWrapper.setTitle(title);
	}
	setExpanded(expanded : boolean) : void {
		if (this._expanded === expanded) {
			return;
		}

		this._titleWrapper.setExpanded(expanded);

		if (expanded) {
			this._contentElm.style.display = "block";
		} else {
			this._contentElm.style.display = "none";
		}

		this._expanded = expanded;
	}
	contentElm() : HTMLElement { return this._contentElm; }
}

class TitleWrapper extends HtmlWrapper<HTMLElement> {

	private _titleElm : HTMLElement;
	private _iconElm : HTMLElement;

	constructor() {
		super(Html.div());

		this._titleElm = Html.span();

		this._iconElm = Icon.create(IconType.ARROW_DOWN);
		this._iconElm.style.float = "right";
		this._iconElm.style.fontWeight = "bold";

		this.elm().classList.add(Html.classCategoryTitle);
		this.elm().appendChild(this._titleElm);
		this.elm().appendChild(this._iconElm);
	}

	setTitle(title : string) : void {
		this._titleElm.textContent = title;
	}

	setExpanded(expanded : boolean) : void {
		Icon.change(this._iconElm, expanded ? IconType.ARROW_DOWN : IconType.ARROW_UP);
	}
}