
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class ModeInfoWrapper extends HtmlWrapper<HTMLElement> {

	private _descriptionElm : HTMLElement;
	private _requirementsElm : HTMLElement;
	private _errorElm : HTMLElement;

	constructor() {
		super(Html.div());

		this._descriptionElm = Html.div();
		this._requirementsElm = Html.div();
		this._errorElm = Html.div();

		this.elm().appendChild(this._descriptionElm);
		this.elm().appendChild(Html.br());
		this.elm().appendChild(this._requirementsElm);
		this.elm().appendChild(Html.br());
		this.elm().appendChild(this._errorElm);
	}

	show() : void {
		this.elm().style.display = "block";
	}
	hide() : void {
		this.elm().style.display = "none";
	}

	setRequirements(reqs : Array<string>) : void {
		this._requirementsElm.innerHTML = "";

		if (reqs.length === 0) {
			reqs.push("Any number of players allowed");
		}

		for (let i = 0; i < reqs.length; ++i) {
			this._requirementsElm.innerHTML += `<li>${reqs[i]}</li>`;
		}
		this.clearError();
	}

	setDescription(description : string) : void {
		this._descriptionElm.innerHTML = description;
		this.clearError();
	}

	setError(error : string) : void {
		this._errorElm.innerHTML = error;
	}
	setErrors(errors : string[]) : void {
		if (errors.length === 0) {
			this.clearError();
			return;
		}

		let error = "Could not start game...<br>"
		for (let i = 0; i < errors.length; ++i) {
			error += `<li>${errors[i]}</li>`;
		}
		this.setError(error);
	}
	clearError() : void { this._errorElm.textContent = ""; }
}