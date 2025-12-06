
import { game } from 'game'

import { Flags } from 'global/flags'

import { settings } from 'settings'
import {
	AntiAliasSetting,
	BuffStatsSetting,
	ChatSetting,
	ClientPredictionSetting,
	DamageNumberSetting,
	FullscreenSetting,
	ClickLockSetting,
	MusicSetting,
	PointerSetting,
	ScreenShakeSetting,
	ShadowSetting,
	SpeedSetting,
	SoundSetting,
	TransparentSetting,

	DelaySetting,
	JitterSetting,
	InspectorSetting,
	NetworkStabilitySetting,
	ShadowFilteringSetting,
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

		let core = this.createCategory("Core");
		core.setAlwaysExpand(true);

		this.addSetting(core, new LabelNumberWrapper({
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

		this.addSetting(core, new LabelNumberWrapper({
			label: "FPS Target",
			value: Number(settings.speedSetting),
			plus: (current : number) => {
				if (current >= SpeedSetting.FAST) {
					return;
				}
				settings.speedSetting++;
			},
			minus: (current : number) => {
				if (current <= SpeedSetting.SLOW) {
					return;
				}
				settings.speedSetting--;
			},
			get: () => { return settings.speedSetting; },
			html: (current : number) => {
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
		}));

		this.addSetting(core, new LabelNumberWrapper({
			label: "Master Volume",
			value: settings.volumePercent,
			plus: (current : number) => {
				settings.volumePercent = Math.min(1, current + 0.1);
				game.audio().refreshSettings();
			},
			minus: (current : number) => {
				settings.volumePercent = Math.max(0, current - 0.1);
				game.audio().refreshSettings();
			},
			get: () => { return settings.volumePercent; },
			html: () => { return Math.round(100 * settings.volumePercent) + "%"; },
		}));

		this.addSetting(core, new LabelNumberWrapper({
			label: "Screen Shake",
			value: Number(settings.screenShakeSetting),
			plus: (current : number) => {
				settings.screenShakeSetting = ScreenShakeSetting.ON;
			},
			minus: (current : number) => {
				settings.screenShakeSetting = ScreenShakeSetting.OFF;
			},
			get: () => { return settings.screenShakeSetting; },
			html: () => {
				if (settings.screenShakeSetting === ScreenShakeSetting.ON) {
					return "On";
				}
				return "Off";
			},
		}));

		let gameplay = this.createCategory("Gameplay");
		gameplay.setExpanded(false);

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

		this.addSetting(gameplay, new LabelNumberWrapper({
			label: "Player Chat",
			value: Number(settings.chatSetting),
			plus: (current : number) => {
				if (current === ChatSetting.ON) {
					return;
				}
				settings.chatSetting++;
			},
			minus: (current : number) => {
				if (current === ChatSetting.OFF) {
					return;
				}
				settings.chatSetting--;
			},
			get: () => { return settings.chatSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(ChatSetting[current]);
			},
		}));

		this.addSetting(gameplay, new LabelNumberWrapper({
			label: "Click Lock",
			value: Number(settings.clickLockSetting),
			plus: (current : number) => {
				if (current === ClickLockSetting.ON) {
					return;
				}
				settings.clickLockSetting++;
			},
			minus: (current : number) => {
				if (current === ClickLockSetting.OFF) {
					return;
				}
				settings.clickLockSetting--;
			},
			get: () => { return settings.clickLockSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(ClickLockSetting[current]);
			},
		}));

		let graphics = this.createCategory("Graphics");
		graphics.setExpanded(false);

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
			value: Number(settings.shadowFilteringSetting),
			plus: (current : number) => {
				if (current === ShadowFilteringSetting.HIGH) {
					return;
				}
				settings.shadowFilteringSetting++;
			},
			minus: (current : number) => {
				if (current === ShadowFilteringSetting.NONE) {
					return;
				}
				settings.shadowFilteringSetting--;
			},
			get: () => { return settings.shadowFilteringSetting; },
			html: (current : number) => {
				return Strings.toTitleCase(ShadowFilteringSetting[current]);
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
		sound.setExpanded(false);

		this.addSetting(sound, new LabelNumberWrapper({
			label: "Music",
			value: Number(settings.musicSetting),
			plus: (current : number) => {
				settings.musicSetting = MusicSetting.ON;
				game.audio().refreshSettings();
			},
			minus: (current : number) => {
				settings.musicSetting = MusicSetting.OFF;
				game.audio().refreshSettings();
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
				game.audio().refreshSettings();
			},
			minus: (current : number) => {
				settings.musicPercent = Math.max(0, current - 0.1);
				game.audio().refreshSettings();
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

		if (ui.mode() === UiMode.MENU) {
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
		return category;
	}

	private addSetting<T extends number>(category : CategoryWrapper, setting : LabelNumberWrapper) : void {
		category.contentElm().appendChild(setting.elm());
		this._wrappers.push(setting);
	}
}