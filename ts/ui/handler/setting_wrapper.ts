
import { options } from 'options'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class SettingInputOptions {
	id: string;
	type: string;
	label: string;

	min?: number;
	max?: number;
	step?: number;

	getOption: () => boolean | number;
	setOption: (value : boolean | number) => void;
}

export class SettingWrapper extends HtmlWrapper {

	constructor(options : SettingInputOptions) {
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
			input.checked = <boolean>options.getOption();
		} else if (input.type === "range") {
			input.value = "" + <number>options.getOption();
		}
		input.onchange = () => {
			if (input.type === "checkbox") {
				if (options.getOption() === input.checked) {
					return;
				}
				options.setOption(input.checked);
			} else if (input.type === "range") {
				const value = Math.min(options.max, Math.max(options.min, Number(input.value)));
				if (options.getOption() === value) {
					return;
				}
				options.setOption(value);
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