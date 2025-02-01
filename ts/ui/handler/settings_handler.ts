
import { game } from 'game'

import { settings } from 'settings'
import {
	AntiAliasSetting,
	ClientPredictionSetting,
	DamageNumberSetting,
	FullscreenSetting,
	MusicSetting,
	PointerSetting,
	ShadowSetting,
	SpeedSetting,
	SoundSetting,
	TransparentSetting,

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

	private _wrappers : Array<LabelNumberWrapper>;
	private _settingsElm : HTMLElement;

	constructor() {
		super(HandlerType.SETTINGS);

		this._wrappers = new Array();
		this._settingsElm = Html.elm(Html.fieldsetSettings);
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		this._settingsElm.onclick = (e) => {
			e.stopPropagation();
		};

		let gameplay = this.createCategory("Gameplay");

		this.addSetting(gameplay, new LabelNumberWrapper({
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
		}));

		if (!game.isHost()) {
			this.addSetting(gameplay, new LabelNumberWrapper({
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
			}));
		}

		this.addSetting(gameplay, new LabelNumberWrapper({
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
		}));

		let graphics = this.createCategory("Graphics");

		this.addSetting(graphics, new LabelNumberWrapper({
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
		}));

		this.addSetting(graphics, new LabelNumberWrapper({
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
		}));

		this.addSetting(graphics, new LabelNumberWrapper({
			label: "Shadows",
			value: Number(settings.shadowSetting),
			plus: (current : number) => {
				settings.shadowSetting = ShadowSetting.ON;
			},
			minus: (current : number) => {
				settings.shadowSetting = ShadowSetting.OFF;
			},
			get: () => { return settings.shadowSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(ShadowSetting[current]);
			},
		}));

		this.addSetting(graphics, new LabelNumberWrapper({
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
		}));

		this.addSetting(graphics, new LabelNumberWrapper({
			label: "Smooth Transparency",
			value: Number(settings.transparentSetting),
			plus: (current : number) => {
				settings.transparentSetting = TransparentSetting.ON;
			},
			minus: (current : number) => {
				settings.transparentSetting = TransparentSetting.OFF;
			},
			get: () => { return settings.transparentSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(ShadowSetting[current]);
			},
		}));


		let sound = this.createCategory("Audio");

		this.addSetting(sound, new LabelNumberWrapper({
			label: "Music",
			value: Number(settings.musicSetting),
			plus: (current : number) => {
				settings.musicSetting = MusicSetting.ON;
			},
			minus: (current : number) => {
				settings.musicSetting = MusicSetting.OFF;
			},
			get: () => { return settings.musicSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(MusicSetting[current]);
			},
		}));

		this.addSetting(sound, new LabelNumberWrapper({
			label: "Music Volume",
			value: settings.musicPercent,
			plus: (current : number) => {
				settings.musicPercent = Math.min(1, current + 0.1);
			},
			minus: (current : number) => {
				settings.musicPercent = Math.max(0, current - 0.1);
			},
			get: () => { return settings.musicPercent; },
			html: () => { return Math.round(100 * settings.musicPercent) + "%"; },
		}));

		this.addSetting(sound, new LabelNumberWrapper({
			label: "Sound Effects",
			value: Number(settings.soundSetting),
			plus: (current : number) => {
				settings.soundSetting = SoundSetting.ON;
			},
			minus: (current : number) => {
				settings.soundSetting = SoundSetting.OFF;
			},
			get: () => { return settings.soundSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(SoundSetting[current]);
			},
		}));

		this.addSetting(sound, new LabelNumberWrapper({
			label: "Sound Effects Volume",
			value: settings.soundPercent,
			plus: (current : number) => {
				settings.soundPercent = Math.min(1, current + 0.1);
			},
			minus: (current : number) => {
				settings.soundPercent = Math.max(0, current - 0.1);
			},
			get: () => { return settings.soundPercent; },
			html: () => { return Math.round(100 * settings.soundPercent) + "%"; },
		}));

		if (isLocalhost()) {
			let debug = this.createCategory("Debug");
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
		} else if (ui.mode() === UiMode.MENU) {
			this.refresh();
		}
	}

	refresh() : void {
		this._wrappers.forEach((wrapper : LabelNumberWrapper) => {
			wrapper.refresh();
		})
	}

	private createCategory(name : string) : CategoryWrapper {
		let category = new CategoryWrapper();
		category.setTitle(name);
		this._settingsElm.appendChild(category.elm());
		return category
	}

	private addSetting<T extends number>(category : CategoryWrapper, setting : LabelNumberWrapper) : void {
		category.contentElm().appendChild(setting.elm());
		this._wrappers.push(setting);
	}
}