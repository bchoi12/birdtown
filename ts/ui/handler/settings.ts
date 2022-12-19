
import { game } from 'game'

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

		let pointerLock = new SettingWrapper({
			id: "input-pointer-lock",
			type: "checkbox",
			label: "Enable in-game cursor",

			getOption: () => {
				return options.enablePointerLock;
			},
			setOption: (value: boolean) => {
				options.enablePointerLock = value;
			},
		});
		this._settingsElm.appendChild(pointerLock.elm());

		if (isLocalhost()) {
			let inspector = new SettingWrapper({
				id: "input-inspector",
				type: "checkbox",
				label: "Enable inspector",

				getOption: () => {
					return options.debugInspector;
				},
				setOption: (value: boolean) => {
					options.debugInspector = value;
				},
			});
			this._settingsElm.appendChild(inspector.elm());
		}

		let prediction = new SettingWrapper({
			id: "input-prediction",
			type: "range",
			label: "Client-side prediction",

			min: 0,
			max: 1,
			step: .01,

			getOption: () => {
				return options.predictionWeight;
			},
			setOption: (value : number) => {
				options.predictionWeight = value;
			},
		});
		this._settingsElm.appendChild(prediction.elm());

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
				document.documentElement.requestFullscreen();
			} else if (window.innerHeight === screen.height) {
				document.exitFullscreen();
			}

			if (options.debugInspector) {
				game.scene().debugLayer.show();
			} else {
				game.scene().debugLayer.hide();
			}
		}		
	}
}