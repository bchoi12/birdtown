
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class ScoreWrapper extends HtmlWrapper<HTMLElement> {

	private _nameElm : HTMLElement;
	private _scoreElm : HTMLElement;

	constructor() {
		super(Html.div());

		this._nameElm = Html.span();
		this.elm().appendChild(this._nameElm);

		this._scoreElm = Html.span();
		this.elm().appendChild(this._scoreElm);
	}

	setDisplayName(name : string) : void {
		this._nameElm.textContent = name;
	}

	setScore(score : string) : void {
		this._scoreElm.textContent = score;
	}
}