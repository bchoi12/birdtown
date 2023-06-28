
import { game } from 'game'

import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { settings } from 'settings'

import { UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { SettingWrapper } from 'ui/wrapper/setting_wrapper'
import { Html } from 'ui/html'

import { isLocalhost } from 'util/common'

export class SettingsHandler extends HandlerBase implements Handler{

	private _settingsElm : HTMLElement;

	constructor() {
		super(HandlerType.SETTINGS);

		this._settingsElm = Html.elm(Html.fieldsetSettings);
	}

	override setup() : void {
		this._settingsElm.onclick = (e) => {
			e.stopPropagation();
		};

		let fullscreen = new SettingWrapper({
			id: "input-fullscreen",
			type: "checkbox",
			label: "Enable fullscreen",

			getSetting: () => { return settings.enableFullscreen; },
			setSetting: (value: boolean) => { settings.enableFullscreen = value; },
		});
		this._settingsElm.appendChild(fullscreen.elm());

		let pointerLock = new SettingWrapper({
			id: "input-pointer-lock",
			type: "checkbox",
			label: "Enable in-game cursor",

			getSetting: () => { return settings.enablePointerLock; },
			setSetting: (value: boolean) => { settings.enablePointerLock = value; },
		});
		this._settingsElm.appendChild(pointerLock.elm());

		if (isLocalhost()) {
			let inspector = new SettingWrapper({
				id: "input-debug-inspector",
				type: "checkbox",
				label: "Enable inspector",

				getSetting: () => {
					return settings.debugInspector;
				},
				setSetting: (value: boolean) => {
					settings.debugInspector = value;
				},
			});
			this._settingsElm.appendChild(inspector.elm());
		}

		// TODO: hide on game start
		let prediction = new SettingWrapper({
			id: "input-prediction",
			type: "checkbox",
			label: "Client-side prediction",

			getSetting: () => { return settings.enablePrediction; },
			setSetting: (value : boolean) => { settings.enablePrediction = value; },
		});
		this._settingsElm.appendChild(prediction.elm());

		if (isLocalhost()) {
			let delay = new SettingWrapper({
				id: "input-debug-delay",
				type: "range",
				label: "Delay",

				min: 0,
				max: 100,
				step: 1,

				getSetting: () => { return settings.debugDelay; },
				setSetting: (value : number) => { settings.debugDelay = value; },
			});
			this._settingsElm.appendChild(delay.elm());		
		}
	}

	override setMode(mode : UiMode) : void {
		if (mode !== UiMode.PAUSE) {
			if (settings.enableFullscreen) {
				document.documentElement.requestFullscreen();
			} else if (window.innerHeight === screen.height) {
				document.exitFullscreen();
			}

			if (settings.debugInspector) {
				game.scene().debugLayer.show();
			} else {
				game.scene().debugLayer.hide();
			}
		}		
	}
}