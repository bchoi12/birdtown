
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { InfoWrapper } from 'ui/wrapper/info_wrapper'

export class ScoreboardWrapper extends DialogWrapper {

	private _infoWrapper : InfoWrapper;

	constructor() {
		super();

		this._infoWrapper = new InfoWrapper();

		this.contentElm().appendChild(this._infoWrapper.elm());

		this.setTitle("Scoreboard");
		this.elm().style.opacity = "1";
	}

	infoWrapper() : InfoWrapper { return this._infoWrapper; }
}