
import { settings } from 'settings'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export type SettingWrapperOptions<T extends number> = {
	name: string;

	get: () => T;
	click: (current : T) => void;
	text: (current : T) => string;
}

export class SettingWrapper<T extends number> extends HtmlWrapper<HTMLElement> {

	private _setting : SettingWrapperOptions<T>;
	private _nameElm : HTMLElement;
	private _settingElm : HTMLElement;

	constructor(setting : SettingWrapperOptions<T>) {
		super(Html.div());

		this._setting = setting;

		this.elm().classList.add(Html.classSetting);
		this.elm().classList.add(Html.classButton);

		this._nameElm = Html.div();
		this._nameElm.style.float = "left";
		this._nameElm.textContent = this._setting.name;
		this.elm().appendChild(this._nameElm);

		this._settingElm = Html.div();
		this._settingElm.style.float = "right";
		this.updateText();
		this.elm().appendChild(this._settingElm);

		this.elm().onclick = (e) => {
			this._setting.click(this._setting.get());
			this.updateText();
		}
	}

	private updateText() : void {
		this._settingElm.textContent = "[" + this._setting.text(this._setting.get()) + "]"
	}
}