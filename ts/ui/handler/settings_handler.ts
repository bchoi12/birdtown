
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
		super.setup();

		this._settingsElm.onclick = (e) => {
			e.stopPropagation();
		};

		let frameRate = new SettingWrapper<SpeedSetting>({
			name: "FPS Cap",
			get: () => { return settings.fpsSetting; },
			click: (current : SpeedSetting) => {
				if (current === SpeedSetting.FAST) {
					settings.fpsSetting = SpeedSetting.SLOW;
				} else {
					settings.fpsSetting++;
				}
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
			get: () => { return settings.antiAliasSetting; },
			click: (current : AntiAliasSetting) => {
				if (current === AntiAliasSetting.HIGH) {
					settings.antiAliasSetting = AntiAliasSetting.NONE;
				} else {
					settings.antiAliasSetting++;
				}
			},
			text: (current : AntiAliasSetting) => {
				return AntiAliasSetting[current];
			},
		});
		this._settingsElm.appendChild(antiAlias.elm());

		let clientPrediction = new SettingWrapper<ClientPredictionSetting>({
			name: "Client-side Prediction",
			get: () => { return settings.clientPredictionSetting; },
			click: (current : ClientPredictionSetting) => {
				if (current === ClientPredictionSetting.HIGH) {
					settings.clientPredictionSetting = ClientPredictionSetting.NONE;
				} else {
					settings.clientPredictionSetting++;
				}
			},
			text: (current : ClientPredictionSetting) => {
				return ClientPredictionSetting[current];
			},
		});
		this._settingsElm.appendChild(clientPrediction.elm());

		let inspector = new SettingWrapper<InspectorSetting>({
			name: "[D] Inspector",
			get: () => { return settings.inspectorSetting; },
			click: (current : InspectorSetting) => {
				settings.inspectorSetting = current === InspectorSetting.OFF ? InspectorSetting.ON : InspectorSetting.OFF;
			},
			text: (current : InspectorSetting) => {
				return InspectorSetting[current];
			},
		});
		this._settingsElm.appendChild(inspector.elm());

		let delay = new SettingWrapper<DelaySetting>({
			name: "[D] Delay",
			get: () => { return settings.delaySetting; },
			click: (current : DelaySetting) => {
				if (current === DelaySetting.GLOBAL) {
					settings.delaySetting = DelaySetting.NONE;
				} else {
					settings.delaySetting++;
				}
			},
			text: (current : DelaySetting) => {
				return DelaySetting[current];
			},
		});
		this._settingsElm.appendChild(delay.elm());

		let jitter = new SettingWrapper<JitterSetting>({
			name: "[D] Jitter",
			get: () => { return settings.jitterSetting; },
			click: (current : JitterSetting) => {
				if (current === JitterSetting.TERRIBLE) {
					settings.jitterSetting = JitterSetting.NONE;
				} else {
					settings.jitterSetting++;
				}
			},
			text: (current : JitterSetting) => {
				return JitterSetting[current];
			},
		});
		this._settingsElm.appendChild(jitter.elm());

		let networkStability = new SettingWrapper<NetworkStabilitySetting>({
			name: "[D] Network Stability",
			get: () => { return settings.networkStabilitySetting; },
			click: (current : NetworkStabilitySetting) => {
				if (current === NetworkStabilitySetting.TERRIBLE) {
					settings.networkStabilitySetting = NetworkStabilitySetting.PERFECT;
				} else {
					settings.networkStabilitySetting++;
				}
			},
			text: (current : NetworkStabilitySetting) => {
				return NetworkStabilitySetting[current];
			},
		});
		this._settingsElm.appendChild(networkStability.elm());
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		if (ui.mode() === UiMode.GAME) {
			ui.applySettings();
		}		
	}
}