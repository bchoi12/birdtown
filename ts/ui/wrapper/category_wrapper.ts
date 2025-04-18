
import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

export class CategoryWrapper extends HtmlWrapper<HTMLElement> {

	private _titleWrapper : TitleWrapper;
	private _contentElm : HTMLElement;
	private _alwaysExpand : boolean;
	private _expanded : boolean;

	constructor() {
		super(Html.div());

		this._titleWrapper = new TitleWrapper();

		this._contentElm = Html.div();
		this._contentElm.classList.add(Html.classCategoryContent);

		this._alwaysExpand = false;
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
	setAlwaysExpand(alwaysExpand : boolean) : void {
		if (this._alwaysExpand === alwaysExpand) {
			return;
		}

		this._alwaysExpand = alwaysExpand;
		if (this._alwaysExpand) {
			this._titleWrapper.setIconVisible(false);
			this.setExpanded(true);
		} else {
			this._titleWrapper.setIconVisible(true);
		}
	}
	setExpanded(expanded : boolean) : void {
		if (this._expanded === expanded) {
			return;
		}

		if (!expanded && this._alwaysExpand) {
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
		this.elm().classList.add(Html.classNoSelect);
		this.elm().appendChild(this._titleElm);
		this.elm().appendChild(this._iconElm);
	}

	setTitle(title : string) : void {
		this._titleElm.textContent = title;
	}

	setExpanded(expanded : boolean) : void {
		Icon.change(this._iconElm, expanded ? IconType.ARROW_DOWN : IconType.ARROW_UP);
	}

	setIconVisible(visible : boolean) : void {
		if (visible) {
			this._iconElm.style.display = "block";
		} else {
			this._iconElm.style.display = "none";
		}
	}
}