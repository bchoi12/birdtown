
import { settings } from 'settings'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export type SettingWrapperOptions = {
	id: string;
	type: string;
	label: string;

	min?: number;
	max?: number;
	step?: number;

	getSetting: () => boolean | number;
	setSetting: (value : boolean | number) => void;
}

export class SettingWrapper extends HtmlWrapper {

	constructor(options : SettingWrapperOptions) {
		super(Html.div());

		this.elm().classList.add("setting");

		let input = Html.input();
		input.id = options.id;
		input.type = options.type;

		if (options.min) {
			input.min = "" + options.min;
		}
		if (options.max) {
			input.max = "" + options.max;
		}
		if (options.step) {
			input.step = "" + options.step;
		}

		if (input.type === "checkbox") {
			input.checked = <boolean>options.getSetting();
		} else if (input.type === "range") {
			input.value = "" + <number>options.getSetting();
		}
		input.onchange = () => {
			if (input.type === "checkbox") {
				if (options.getSetting() === input.checked) {
					return;
				}
				options.setSetting(input.checked);
			} else if (input.type === "range") {
				const value = Math.min(options.max, Math.max(options.min, Number(input.value)));
				if (options.getSetting() === value) {
					return;
				}
				options.setSetting(value);
			}
		}

		let label = Html.label();
		// @ts-ignore
		label.htmlFor = options.id;
		label.textContent = options.label;

		this.elm().appendChild(input);
		this.elm().appendChild(label);
	}
}