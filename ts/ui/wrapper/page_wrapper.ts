
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

		this._buttonGroups = new Map();
		this._lastGroupId = 0;
		this._onSubmit = () => {};
	}

	setOnSubmit(fn : OnSubmitFn) : void { this._onSubmit = fn; }
	submit() : void { this._onSubmit(); }

	addButtonGroup() : number {
		this._lastGroupId++;
		this._buttonGroups.set(this._lastGroupId, new Array())
		return this._lastGroupId;
	}
	getButtons(group : number) : Array<ButtonWrapper> { return this._buttonGroups.get(group); }
	addButton(group : number) : ButtonWrapper {
		if (!this._buttonGroups.has(group)) {
			console.error("Error: skipping attempt to add button to nonexistent group", group);
			return;
		}

		let buttonWrapper = new ButtonWrapper(this._buttonGroups.get(group).length + 1);
		this._buttonGroups.get(group).push(buttonWrapper);
		this.elm().appendChild(buttonWrapper.elm());

		return buttonWrapper;
	}
}