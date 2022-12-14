
import { options } from 'options'

import { HandlerType, Mode } from 'ui'
import { Handler, HandlerBase } from 'ui/handler'
import { SettingWrapper } from 'ui/handler/setting_wrapper'
import { Html } from 'ui/html'

import { isLocalhost } from 'util/common'

export class Settings extends HandlerBase implements Handler{

	private _settingsElm : HTMLElement;

	constructor() {
		super(HandlerType.SETTINGS);

		this._settingsElm = Html.elm(Html.fieldsetSettings);
	}

	setup() : void {
		this._settingsElm.onclick = (e) => {
			e.stopPropagation();
		};

		let fullscreen = new SettingWrapper({
			id: "input-fullscreen",
			type: "checkbox",
			label: "Enable fullscreen",

			getOption: () => {
				return options.enableFullscreen;
			},
			setOption: (value: boolean) => {
				options.enableFullscreen = value;
			},
		});
		this._settingsElm.appendChild(fullscreen.elm());

		if (isLocalhost()) {
			let debugDelay = new SettingWrapper({
				id: "input-debug-delay",
				type: "range",
				label: "Delay",

				min: 0,
				max: 50,
				step: 1,

				getOption: () => {
					return options.debugDelay;
				},
				setOption: (value : number) => {
					options.debugDelay = value;
				},
			});
			this._settingsElm.appendChild(debugDelay.elm());
		}
	}

	reset() : void {}

	setMode(mode : Mode) : void {
		if (mode !== Mode.PAUSE) {
			if (options.enableFullscreen) {
				let elm = document.documentElement;
				elm.requestFullscreen();
			} else {
				document.exitFullscreen();
			}
		}		
	}
}