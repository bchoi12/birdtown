
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

type OnSubmitFn = () => void;

export class PageWrapper extends HtmlWrapper<HTMLElement> {

	private _buttonGroups : Map<number, Array<ButtonWrapper>>;
	private _lastGroupId : number;
	private _onSubmit : OnSubmitFn;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classDialogPage);

		this._buttonGroups = new Map();
		this._lastGroupId = 0;
		this._onSubmit = () => {};
	}

	setOnSubmit(fn : OnSubmitFn) : void { this._onSubmit = fn; }
	submit() : void { this._onSubmit(); }
}