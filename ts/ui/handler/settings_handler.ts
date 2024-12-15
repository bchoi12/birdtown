
import { game } from 'game'

import { settings } from 'settings'
import {
	AntiAliasSetting,
	ClientPredictionSetting,
	DamageNumberSetting,
	FullscreenSetting,
	PointerSetting,
	ShadowSetting,
	SpeedSetting,

	DelaySetting,
	JitterSetting,
	InspectorSetting,
	NetworkStabilitySetting,
	FilteringQuality,
} from 'settings/api'

import { Strings } from 'strings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
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

		let gameplay = new CategoryWrapper();
		gameplay.setTitle("Gameplay");

		let fullscreen = new LabelNumberWrapper({
			label: "Fullscreen",
			value: Number(settings.fullscreenSetting),
			plus: (current : number) => {
				settings.fullscreenSetting = FullscreenSetting.FULLSCREEN;
			},
			minus: (current : number) => {
				settings.fullscreenSetting = FullscreenSetting.WINDOWED;
			},
			get: () => { return settings.fullscreenSetting; },
			html: () => {
				if (settings.fullscreenSetting === FullscreenSetting.FULLSCREEN) {
					return "On";
				}
				return "Off";
			},
		});
		gameplay.contentElm().appendChild(fullscreen.elm());

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
			gameplay.contentElm().appendChild(clientPrediction.elm());
		}

		let damageNumbers = new LabelNumberWrapper({
			label: "Damage Stats",
			value: Number(settings.damageNumberSetting),
			plus: (current : number) => {
				settings.damageNumberSetting = DamageNumberSetting.ON;
			},
			minus: (current : number) => {
				settings.damageNumberSetting = DamageNumberSetting.OFF;
			},
			get: () => { return settings.damageNumberSetting; },
			html: () => {
				if (settings.damageNumberSetting === DamageNumberSetting.ON) {
					return "On";
				}
				return "Off";
			},
		});
		gameplay.contentElm().appendChild(damageNumbers.elm());

		this._settingsElm.appendChild(gameplay.elm());

		let graphics = new CategoryWrapper();
		graphics.setTitle("Graphics");

		let frameRate = new LabelNumberWrapper({
			label: "Rendering Cap",
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
		graphics.contentElm().appendChild(frameRate.elm());

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
		graphics.contentElm().appendChild(antiAlias.elm());

		let shadows = new LabelNumberWrapper({
			label: "Shadows",
			value: Number(settings.shadowEnabled),
			plus: (current : number) => {
				settings.shadowEnabled = ShadowSetting.ON;
			},
			minus: (current : number) => {
				settings.shadowEnabled = ShadowSetting.OFF;
			},
			get: () => { return settings.shadowEnabled; },
			html: (current : number) => {
				return Strings.toTitleCase(ShadowSetting[current]);
			},
		});
		graphics.contentElm().appendChild(shadows.elm());

		let shadowQuality = new LabelNumberWrapper({
			label: "Shadow Filtering",
			value: Number(settings.shadowFiltering),
			plus: (current : number) => {
				if (current === FilteringQuality.HIGH) {
					return;
				}
				settings.shadowFiltering++;
			},
			minus: (current : number) => {
				if (current === FilteringQuality.NONE) {
					return;
				}
				settings.shadowFiltering--;
			},
			get: () => { return settings.shadowFiltering; },
			html: (current : number) => {
				return Strings.toTitleCase(FilteringQuality[current]);
			},
		});
		graphics.contentElm().appendChild(shadowQuality.elm());

		this._settingsElm.appendChild(graphics.elm());

		let sound = new CategoryWrapper();
		sound.setTitle("Sound");

		let volume = new LabelNumberWrapper({
			label: "Master Volume",
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
		sound.contentElm().appendChild(volume.elm());

		this._settingsElm.appendChild(sound.elm());

		if (isLocalhost()) {
			let debug = new CategoryWrapper();
			debug.setTitle("Debug");
			debug.setExpanded(false);

			let inspector = new SettingWrapper<InspectorSetting>({
				name: "Inspector",
				value: settings.inspectorSetting,
				click: (current : InspectorSetting) => {
					settings.inspectorSetting = current === InspectorSetting.OFF ? InspectorSetting.ON : InspectorSetting.OFF;
					return settings.inspectorSetting;
				},
				text: (current : InspectorSetting) => {
					return InspectorSetting[current];
				},
			});
			debug.contentElm().appendChild(inspector.elm());

			let delay = new SettingWrapper<DelaySetting>({
				name: "Delay",
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
			debug.contentElm().appendChild(delay.elm());

			let jitter = new SettingWrapper<JitterSetting>({
				name: "Jitter",
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
			debug.contentElm().appendChild(jitter.elm());

			let networkStability = new SettingWrapper<NetworkStabilitySetting>({
				name: "Network Stability",
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
			debug.contentElm().appendChild(networkStability.elm());

			this._settingsElm.appendChild(debug.elm());
		}
	}

	override onModeChange(mode : UiMode, oldMode : UiMode) : void {
		super.onModeChange(mode, oldMode);

		if (ui.mode() === UiMode.GAME) {
			ui.applySettings();
		}		
	}
}