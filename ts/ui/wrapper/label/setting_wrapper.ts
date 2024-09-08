
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { LabelButtonWrapper } from 'ui/wrapper/label/label_button_wrapper'

export type SettingWrapperOptions<T extends number> = {
	name: string;
	value: T;

	click: (current : T) => T;

	// Need at least one
	text?: (current : T) => string;
	html?: (current : T) => string;
}

export class SettingWrapper<T extends number> extends LabelButtonWrapper {

	private _value : T;
	private _options : SettingWrapperOptions<T>;

	constructor(options : SettingWrapperOptions<T>) {
		super();

		this._options = options;
		this._value = options.value;

		if (!this._options.text && !this._options.html) {
			console.error("Error: SettingWrapper missing both text and html");
			this.setName("ERROR");
			return;
		} else if (this._options.text && this._options.html) {
			console.error("Warning: ignoring html function since text is also set");
		}

		this.setName(this._options.name);
		this.refresh();

		this.elm().onclick = (e) => {
			this._value = this._options.click(this._value);
			this.refresh();
		}
	}

	value() : T { return this._value; }
	refresh() : void {
		if (this._options.text) {
			this.setButtonText(this._options.text(this._value));
		} else if (this._options.html) {
			this.setButtonHTML(this._options.html(this._value));
		}
	}

	override setButtonText(text : string) : void { super.setButtonText("[" + text + "]"); }
	override setButtonHTML(html : string) : void { super.setButtonHTML("[" + html + "]"); }
}