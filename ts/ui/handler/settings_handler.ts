
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

		let antiAlias = new SettingWrapper({
			id: "input-anti-alias",
			type: "checkbox",
			label: "Enable anti-aliasing",

			getSetting: () => { return settings.enableAntiAlias; },
			setSetting: (value: boolean) => { settings.enableAntiAlias = value; },
		});
		this._settingsElm.appendChild(antiAlias.elm());

		// TODO: hide on game start if hosting
		let prediction = new SettingWrapper({
			id: "input-prediction",
			type: "checkbox",
			label: "Client-side prediction",

			getSetting: () => { return settings.enablePrediction; },
			setSetting: (value : boolean) => { settings.enablePrediction = value; },
		});
		this._settingsElm.appendChild(prediction.elm());

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

		let freezeCamera = new SettingWrapper({
			id: "input-debug-freeze-camera",
			type: "checkbox",
			label: "Freeze camera",

			getSetting: () => { return settings.debugFreezeCamera; },
			setSetting: (value: boolean) => { settings.debugFreezeCamera = value; },
		});
		this._settingsElm.appendChild(freezeCamera.elm());

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

		let jitter = new SettingWrapper({
			id: "input-debug-jitter",
			type: "range",
			label: "Jitter",

			min: 0,
			max: 100,
			step: 1,

			getSetting: () => { return settings.debugJitter; },
			setSetting: (value : number) => { settings.debugJitter = value; },
		});
		this._settingsElm.appendChild(jitter.elm());	

		let sendFailure = new SettingWrapper({
			id: "input-debug-send-failure",
			type: "range",
			label: "Send Failure",

			min: 0,
			max: 0.5,
			step: .01,

			getSetting: () => { return settings.debugSendFailure; },
			setSetting: (value : number) => { settings.debugSendFailure = value; },
		});
		this._settingsElm.appendChild(sendFailure.elm());		
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