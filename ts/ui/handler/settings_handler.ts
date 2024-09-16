
import { game } from 'game'

import { settings } from 'settings'
import {
	AntiAliasSetting,
	ClientPredictionSetting,
	FullscreenSetting,
	PointerSetting,
	SpeedSetting,

	DelaySetting,
	JitterSetting,
	InspectorSetting,
	NetworkStabilitySetting,
} from 'settings/api'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'
import { Html } from 'ui/html'

import { isLocalhost } from 'util/common'

export class SettingsHandler extends HandlerBase implements Handler{

	private _settingsElm : HTMLElement;

	constructor() {
		super(HandlerType.SETTINGS);

		this._settingsElm = Html.elm(Html.fieldsetSettings);
	}

	override setup() : void {
		super.setup();

		this._settingsElm.onclick = (e) => {
			e.stopPropagation();
		};

		let fullscreen = new SettingWrapper<FullscreenSetting>({
			name: "Window Mode",
			value: settings.fullscreenSetting,
			click: (current : FullscreenSetting) => {
				if (current === FullscreenSetting.WINDOWED) {
					settings.fullscreenSetting = FullscreenSetting.FULLSCREEN;
				} else {
					settings.fullscreenSetting = FullscreenSetting.WINDOWED;
				}
				return settings.fullscreenSetting;
			},
			text: (current : FullscreenSetting) => {
				return FullscreenSetting[current];
			},
		});
		this._settingsElm.appendChild(fullscreen.elm());

		let frameRate = new SettingWrapper<SpeedSetting>({
			name: "Render Cap",
			value: settings.fpsSetting,
			click: (current : SpeedSetting) => {
				if (current >= SpeedSetting.NORMAL) {
					settings.fpsSetting = SpeedSetting.SLOW;
				} else {
					settings.fpsSetting++;
				}
				return settings.fpsSetting;
			},
			text: (current : SpeedSetting) => {
				switch (current) {
				case SpeedSetting.SLOW:
					return "30 FPS";
				case SpeedSetting.NORMAL:
					return "60 FPS";
				case SpeedSetting.FAST:
					return "120 FPS";
				default:
					return SpeedSetting[current];
				}
			},
		});
		this._settingsElm.appendChild(frameRate.elm());

		let antiAlias = new SettingWrapper<AntiAliasSetting>({
			name: "Anti-aliasing",
			value: settings.antiAliasSetting,
			click: (current : AntiAliasSetting) => {
				if (current === AntiAliasSetting.HIGH) {
					settings.antiAliasSetting = AntiAliasSetting.NONE;
				} else {
					settings.antiAliasSetting++;
				}
				return settings.antiAliasSetting;
			},
			text: (current : AntiAliasSetting) => {
				return AntiAliasSetting[current];
			},
		});
		this._settingsElm.appendChild(antiAlias.elm());

		let clientPrediction = new SettingWrapper<ClientPredictionSetting>({
			name: "Client-side Prediction",
			value: settings.clientPredictionSetting,
			click: (current : ClientPredictionSetting) => {
				if (current === ClientPredictionSetting.HIGH) {
					settings.clientPredictionSetting = ClientPredictionSetting.NONE;
				} else {
					settings.clientPredictionSetting++;
				}
				return settings.clientPredictionSetting;
			},
			text: (current : ClientPredictionSetting) => {
				return ClientPredictionSetting[current];
			},
		});
		this._settingsElm.appendChild(clientPrediction.elm());

		let inspector = new SettingWrapper<InspectorSetting>({
			name: "[Debug] Inspector",
			value: settings.inspectorSetting,
			click: (current : InspectorSetting) => {
				settings.inspectorSetting = current === InspectorSetting.OFF ? InspectorSetting.ON : InspectorSetting.OFF;
				return settings.inspectorSetting;
			},
			text: (current : InspectorSetting) => {
				return InspectorSetting[current];
			},
		});
		this._settingsElm.appendChild(inspector.elm());

		if (isLocalhost()) {
			let delay = new SettingWrapper<DelaySetting>({
				name: "[Debug] Delay",
				value: settings.delaySetting,
				click: (current : DelaySetting) => {
					if (current === DelaySetting.GLOBAL) {
						settings.delaySetting = DelaySetting.NONE;
					} else {
						settings.delaySetting++;
					}
					return settings.delaySetting;
				},
				text: (current : DelaySetting) => {
					return DelaySetting[current];
				},
			});
			this._settingsElm.appendChild(delay.elm());

			let jitter = new SettingWrapper<JitterSetting>({
				name: "[Debug] Jitter",
				value: settings.jitterSetting,
				click: (current : JitterSetting) => {
					if (current === JitterSetting.TERRIBLE) {
						settings.jitterSetting = JitterSetting.NONE;
					} else {
						settings.jitterSetting++;
					}
					return settings.jitterSetting;
				},
				text: (current : JitterSetting) => {
					return JitterSetting[current];
				},
			});
			this._settingsElm.appendChild(jitter.elm());

			let networkStability = new SettingWrapper<NetworkStabilitySetting>({
				name: "[Debug] Network Stability",
				value: settings.networkStabilitySetting,
				click: (current : NetworkStabilitySetting) => {
					if (current === NetworkStabilitySetting.TERRIBLE) {
						settings.networkStabilitySetting = NetworkStabilitySetting.PERFECT;
					} else {
						settings.networkStabilitySetting++;
					}
					return settings.networkStabilitySetting;
				},
				text: (current : NetworkStabilitySetting) => {
					return NetworkStabilitySetting[current];
				},
			});
			this._settingsElm.appendChild(networkStability.elm());
		}
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		if (ui.mode() === UiMode.GAME) {
			ui.applySettings();
		}		
	}
}