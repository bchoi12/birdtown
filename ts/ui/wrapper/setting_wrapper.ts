
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { LabelButtonWrapper } from 'ui/wrapper/label/label_button_wrapper'

export type SettingWrapperOptions<T extends number> = {
	name: string;

	get: () => T;
	click: (current : T) => void;
	text: (current : T) => string;
}

export class SettingWrapper<T extends number> extends LabelButtonWrapper {

	private _options : SettingWrapperOptions<T>;

	constructor(options : SettingWrapperOptions<T>) {
		super();

		this._options = options;

		this.setName(this._options.name);
		this.setButtonText(this._options.text(this._options.get()));

		this.elm().onclick = (e) => {
			this._options.click(this._options.get());
			this.setButtonText(this._options.text(this._options.get()));
		}
	}

	refresh() : void { this.setButtonText(this._options.text(this._options.get())); }

	override setButtonText(text : string) : void { super.setButtonText("[" + text + "]"); }
}