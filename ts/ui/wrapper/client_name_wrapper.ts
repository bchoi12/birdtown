
import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { LoginNames } from 'ui/common/login_names'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class ClientNameWrapper extends HtmlWrapper<HTMLElement> {

	protected _nameElm : HTMLInputElement;
	// protected _randomize : ButtonWrapper;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classLabel);

		this._nameElm = Html.input();
		this._nameElm.placeholder = "[Enter your name]";
		this._nameElm.style.width = "85%";
		this.elm().appendChild(this._nameElm);

		/*
		this._randomize = new ButtonWrapper();
		this._randomize.elm().style.padding = "0.1em";
		this._randomize.setIcon(IconType.DICE);
		this._randomize.addOnClick(() => {
			this._nameElm.value = LoginNames.randomName();
		});
		this.elm().appendChild(this._randomize.elm());
		*/
	}

	name() : string { return this._nameElm.value.length > 0 ? this._nameElm.value : LoginNames.randomName()}
}