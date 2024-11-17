
import { game } from 'game'

import { settings } from 'settings'
import {
	AntiAliasSetting,
	ClientPredictionSetting,
	DamageNumberSetting,
	FullscreenSetting,
	PointerSetting,
	SpeedSetting,

	DelaySetting,
	JitterSetting,
	InspectorSetting,
	NetworkStabilitySetting,
	ShadowSetting,
} from 'settings/api'

import { Strings } from 'strings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'
import { Html } from 'ui/html'

import { isLocalhost } from 'util/common'

export class SettingsHandler extends HandlerBase implements Handler{

	private _settingsElm : HTMLElement;

	constructor() {
		super(HandlerType.SETTINGS);

		this._settingsElm = Html.elm(Html.fieldsetSettings);
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		this._settingsElm.onclick = (e) => {
			e.stopPropagation();
		};

		let fullscreen = new LabelNumberWrapper({
			label: "Fullscreen",
			value: Number(settings.fullscreenSetting),
			plus: (current : number) => {
				if (current === FullscreenSetting.WINDOWED) {
					settings.fullscreenSetting = FullscreenSetting.FULLSCREEN;
				} else {
					settings.fullscreenSetting = FullscreenSetting.WINDOWED;
				}
			},
			minus: (current : number) => {
				if (current === FullscreenSetting.WINDOWED) {
					settings.fullscreenSetting = FullscreenSetting.FULLSCREEN;
				} else {
					settings.fullscreenSetting = FullscreenSetting.WINDOWED;
				}
			},
			get: () => { return settings.fullscreenSetting; },
			html: () => {
				if (settings.fullscreenSetting === FullscreenSetting.FULLSCREEN) {
					return "On";
				}
				return "Off";
			},
		});
		this._settingsElm.appendChild(fullscreen.elm());

		let frameRate = new LabelNumberWrapper({
			label: "FPS Cap",
			value: Number(settings.fpsSetting),
			plus: (current : number) => {
				if (current >= SpeedSetting.NORMAL) {
					return;
				}
				settings.fpsSetting++;
			},
			minus: (current : number) => {
				if (current <= SpeedSetting.SLOW) {
					return;
				}
				settings.fpsSetting--;
			},
			get: () => { return settings.fpsSetting; },
			html: (current : number) => {
				switch (current) {
				case SpeedSetting.SLOW:
					return "30 FPS";
				case SpeedSetting.NORMAL:
					return "60 FPS";
				default:
					return SpeedSetting[current];
				}
			},
		});
		this._settingsElm.appendChild(frameRate.elm());

		if (!game.isHost()) {
			let clientPrediction = new LabelNumberWrapper({
				label: "Network Smoothing",
				value: Number(settings.clientPredictionSetting),
				plus: (current : number) => {
					if (current === ClientPredictionSetting.HIGH) {
						return;
					}
					settings.clientPredictionSetting++;
				},
				minus: (current : number) => {
					if (current === ClientPredictionSetting.NONE) {
						return;
					}
					settings.clientPredictionSetting--;
				},
				get: () => { return settings.clientPredictionSetting; },
				html: (current : number) => {
					return Strings.toTitleCase(ClientPredictionSetting[current]);
				},
			});
			this._settingsElm.appendChild(clientPrediction.elm());
		}

		let damageNumbers = new LabelNumberWrapper({
			label: "Damage Stats",
			value: Number(settings.damageNumberSetting),
			plus: (current : number) => {
				if (current === DamageNumberSetting.ON) {
					settings.damageNumberSetting = DamageNumberSetting.OFF;
				} else {
					settings.damageNumberSetting = DamageNumberSetting.ON;
				}
			},
			minus: (current : number) => {
				if (current === DamageNumberSetting.ON) {
					settings.damageNumberSetting = DamageNumberSetting.OFF;
				} else {
					settings.damageNumberSetting = DamageNumberSetting.ON;
				}
			},
			get: () => { return settings.damageNumberSetting; },
			html: () => {
				if (settings.damageNumberSetting === DamageNumberSetting.ON) {
					return "On";
				}
				return "Off";
			},
		});
		this._settingsElm.appendChild(damageNumbers.elm());

		let antiAlias = new LabelNumberWrapper({
			label: "Anti-aliasing",
			value: Number(settings.antiAliasSetting),
			plus: (current : number) => {
				if (current === AntiAliasSetting.HIGH) {
					return;
				}
				settings.antiAliasSetting++;
			},
			minus: (current : number) => {
				if (current === AntiAliasSetting.NONE) {
					return;
				}
				settings.antiAliasSetting--;
			},
			get: () => { return settings.antiAliasSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(AntiAliasSetting[current]);
			},
		});
		this._settingsElm.appendChild(antiAlias.elm());

		let shadowQuality = new LabelNumberWrapper({
			label: "Shadow Quality",
			value: Number(settings.shadowSetting),
			plus: (current : number) => {
				if (current === ShadowSetting.HIGH) {
					return;
				}
				settings.shadowSetting++;
			},
			minus: (current : number) => {
				if (current === ShadowSetting.NONE) {
					return;
				}
				settings.shadowSetting--;
			},
			get: () => { return settings.shadowSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(ShadowSetting[current]);
			},
		});
		this._settingsElm.appendChild(shadowQuality.elm());

		let volume = new LabelNumberWrapper({
			label: "Volume",
			value: settings.volume,
			plus: (current : number) => {
				settings.volume = Math.min(1, current + 0.1);
			},
			minus: (current : number) => {
				settings.volume = Math.max(0, current - 0.1);
			},
			get: () => { return settings.volume; },
			html: () => { return Math.round(100 * settings.volume) + "%"; },
		});
		this._settingsElm.appendChild(volume.elm());

		if (isLocalhost()) {
			let inspector = new SettingWrapper<InspectorSetting>({
				name: "[D] Inspector",
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

			let delay = new SettingWrapper<DelaySetting>({
				name: "[D] Delay",
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
				name: "[D] Jitter",
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
				name: "[D] Network Stability",
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