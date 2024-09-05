
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { LabelButtonWrapper } from 'ui/wrapper/label/label_button_wrapper'

export type SettingWrapperOptions<T extends number> = {
	name: string;
	value: T;

	click: (current : T) => T;
	text: (current : T) => string;
}

export class SettingWrapper<T extends number> extends LabelButtonWrapper {

	private _value : T;
	private _options : SettingWrapperOptions<T>;

	constructor(options : SettingWrapperOptions<T>) {
		super();

		this._options = options;
		this._value = options.value;

		this.setName(this._options.name);
		this.setButtonText(this._options.text(this._value));

		this.elm().onclick = (e) => {
			this._value = this._options.click(this._value);
			this.setButtonText(this._options.text(this._value));
		}
	}

	value() : T { return this._value; }
	refresh() : void { this.setButtonText(this._options.text(this._value)); }

	override setButtonText(text : string) : void { super.setButtonText("[" + text + "]"); }
}