
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

type OnClickFn = () => void;

export class ColorWrapper extends HtmlWrapper<HTMLElement> {

	private _color : string;
	private _selected : boolean;
	private _onClick : OnClickFn;

	constructor(color : string) {
		super(Html.div());

		this.elm().classList.add(Html.classColorBlock);

		this._color = color;
		this._selected = false;
		this._onClick = () => {};

		this.elm().style.backgroundColor = this._color;

		this.elm().onclick = (e) => {
			this.setSelected(true);
			this._onClick();
		};
	}

	color() : string { return this._color; }

	setSelected(selected : boolean) : void {
		if (this._selected === selected) {
			return;
		}

		this._selected = selected;

		if (this._selected) {
			this.elm().classList.add(Html.classColorSelected);
		} else {
			this.elm().classList.remove(Html.classColorSelected);
		}
	}

	setOnClick(fn : OnClickFn) : void { this._onClick = fn; }
}