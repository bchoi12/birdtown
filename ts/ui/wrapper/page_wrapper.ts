
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

type CanSubmitFn = () => boolean;
type OnSubmitFn = () => void;

export class PageWrapper extends HtmlWrapper<HTMLElement> {

	private _canSubmit : CanSubmitFn;
	private _onSubmit : OnSubmitFn;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classDialogPage);

		this._canSubmit = () => { return true; }
		this._onSubmit = () => {};
	}

	setCanSubmit(fn : CanSubmitFn) : void { this._canSubmit = fn; }
	canSubmit() : boolean { return this._canSubmit(); }

	setOnSubmit(fn : OnSubmitFn) : void { this._onSubmit = fn; }
	submit() : void { this._onSubmit(); }
}