
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

type CanSubmitFn = () => boolean;
type OnSubmitFn = () => void;

export class PageWrapper extends HtmlWrapper<HTMLElement> {

	private _canSubmit : CanSubmitFn;
	private _onSubmit : OnSubmitFn;
	private _title : string;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classDialogPage);

		this._canSubmit = () => { return true; }
		this._onSubmit = () => {};
		this._title = "";
	}

	setCanSubmit(fn : CanSubmitFn) : void { this._canSubmit = fn; }
	canSubmit() : boolean { return this._canSubmit(); }

	hasTitle() : boolean { return this._title.length > 0; }
	setTitle(title : string) : void { this._title = title; }
	getTitle() : string { return this._title; }

	setOnSubmit(fn : OnSubmitFn) : void { this._onSubmit = fn; }
	submit() : void { this._onSubmit(); }
}