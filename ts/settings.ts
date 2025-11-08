
import { game } from 'game'

import { Flags } from 'global/flags'

import { IdGen } from 'network/id_gen'

import {
	SettingType,

	AntiAliasSetting,
	ChatSetting,
	ClientPredictionSetting,
	DamageNumberSetting,
	FullscreenSetting,
	ClickLockSetting,
	MusicSetting,
	PointerSetting,
	ScreenShakeSetting,
	ShadowSetting,
	ShadowFilteringSetting,
	SpeedSetting,
	SoundSetting,
	TransparentSetting,

	DelaySetting,
	JitterSetting,
	InspectorSetting,
	NetworkStabilitySetting,
} from 'settings/api'
import { Cookie } from 'settings/cookie'

import { KeyType } from 'ui/api'

import { isDesktopApp, isMobile, isLocalhost } from 'util/common'

class Settings {

	private static readonly _mouseLockKeys = new Set([KeyType.MOUSE_CLICK, KeyType.ALT_MOUSE_CLICK]);
	
	private static readonly _volumePercent = 0.8;
	private static readonly _musicPercent = 0.5;
	private static readonly _soundPercent = 0.8;

	public userToken : string;
	// Secret used by host to communicate with perch
	public sessionToken : string;
	public keyCodes : Map<KeyType, number>;
	public mouseCodes : Map<KeyType, number>;

	// Gameplay
	public fullscreenSetting : FullscreenSetting;
	public clientPredictionSetting : ClientPredictionSetting;
	public damageNumberSetting : DamageNumberSetting;
	public chatSetting : ChatSetting;
	public screenShakeSetting : ScreenShakeSetting;
	public clickLockSetting : ClickLockSetting;

	// Audio
	public volumePercent : number;
	public musicSetting : MusicSetting;
	public musicPercent : number;
	public soundSetting : SoundSetting;
	public soundPercent : number;

	// Graphics
	public antiAliasSetting : AntiAliasSetting;
	public speedSetting : SpeedSetting;
	public shadowSetting : ShadowSetting;
	public shadowFilteringSetting : ShadowFilteringSetting;
	public transparentSetting : TransparentSetting;

	// Debug properties
	public inspectorSetting : InspectorSetting;
	public delaySetting : DelaySetting;
	public jitterSetting : JitterSetting;
	public networkStabilitySetting : NetworkStabilitySetting;

	private _cookie : Cookie;

	constructor() {
		this.initialize();

		this._cookie = new Cookie();

		this.load();
	}

	initialize() : void {
		this.userToken = IdGen.randomId(8);
		this.sessionToken = IdGen.randomId(8);

		this.keyCodes = new Map();
		this.keyCodes.set(KeyType.LEFT, 65);
		this.keyCodes.set(KeyType.RIGHT, 68);
		this.keyCodes.set(KeyType.JUMP, 32);
		this.keyCodes.set(KeyType.INTERACT, 69);
		this.keyCodes.set(KeyType.SQUAWK, 81);
		this.keyCodes.set(KeyType.MOUSE_CLICK, 83);
		this.keyCodes.set(KeyType.ALT_MOUSE_CLICK, 16);
		this.keyCodes.set(KeyType.MENU, 27);
		this.keyCodes.set(KeyType.CHAT, 13);
		this.keyCodes.set(KeyType.SCOREBOARD, 9);
		this.keyCodes.set(KeyType.POINTER_LOCK, 67);
		this.keyCodes.set(KeyType.PHOTO, 80);

		this.mouseCodes = new Map();
		this.mouseCodes.set(KeyType.MOUSE_CLICK, 0);
		this.mouseCodes.set(KeyType.ALT_MOUSE_CLICK, 2);

		this.fullscreenSetting = isMobile() ? FullscreenSetting.FULLSCREEN : FullscreenSetting.WINDOWED;
		this.clientPredictionSetting = isMobile() ? ClientPredictionSetting.HIGH : ClientPredictionSetting.MEDIUM;
		this.damageNumberSetting = DamageNumberSetting.OFF;
		this.chatSetting = ChatSetting.FILTER;
		this.screenShakeSetting = ScreenShakeSetting.ON;
		this.clickLockSetting = ClickLockSetting.OFF;

		this.volumePercent = Settings._volumePercent;
		this.musicSetting = MusicSetting.ON
		this.musicPercent = Settings._musicPercent;
		this.soundSetting = SoundSetting.ON;
		this.soundPercent = Settings._soundPercent;

		if (isMobile()) {
			this.lowestSpec();
		} else {
			this.recommendedGraphics();
		}

		this.inspectorSetting = InspectorSetting.OFF;
		this.delaySetting = isLocalhost() ? DelaySetting.LOCAL : DelaySetting.NONE;
		this.jitterSetting = isLocalhost() ? JitterSetting.WIFI : JitterSetting.NONE;
		this.networkStabilitySetting = isLocalhost() ? NetworkStabilitySetting.GOOD : NetworkStabilitySetting.PERFECT;
	}

	reset() : void {
		this.initialize();
		this.save();
	}

	save() : void {
		this._cookie.saveMap(SettingType.KEY_CODES, this.keyCodes);
		this._cookie.saveMap(SettingType.MOUSE_CODES, this.mouseCodes);

		this._cookie.savePairs([
			[SettingType.TOKEN, this.userToken],
			[SettingType.FULLSCREEN, FullscreenSetting[this.fullscreenSetting]],
			[SettingType.CLIENT_PREDICTION, ClientPredictionSetting[this.clientPredictionSetting]],
			[SettingType.DAMAGE_NUMBER, DamageNumberSetting[this.damageNumberSetting]],
			[SettingType.CHAT, ChatSetting[this.chatSetting]],
			[SettingType.MOUSE_DOWN, ClickLockSetting[this.clickLockSetting]],
			[SettingType.SCREEN_SHAKE, ScreenShakeSetting[this.screenShakeSetting]],

			[SettingType.VOLUME_PERCENT, "" + this.volumePercent],
			[SettingType.MUSIC, MusicSetting[this.musicSetting]],
			[SettingType.MUSIC_PERCENT, "" + this.musicPercent],
			[SettingType.SOUND, SoundSetting[this.soundSetting]],
			[SettingType.SOUND_PERCENT, "" + this.soundPercent],

			[SettingType.ANTI_ALIAS, AntiAliasSetting[this.antiAliasSetting]],
			[SettingType.SPEED, SpeedSetting[this.speedSetting]],
			[SettingType.SHADOW, ShadowSetting[this.shadowSetting]],
			[SettingType.SHADOW_FILTERING, ShadowFilteringSetting[this.shadowFilteringSetting]],
			[SettingType.TRANSPARENT, TransparentSetting[this.transparentSetting]],
		]);
	}
	load() : void {
		if (!Flags.refreshToken.get()) {
			this.loadSetting(SettingType.TOKEN, [], (value : string) => {
				this.userToken = value;
			});
		}

		const keyTypes = Object.keys(KeyType).filter((item) => {
		    return Number.isNaN(Number(item)) || Number(item) === 0;
		}).map((type : string) => {
			return KeyType[type];
		});
		const keyCodes = this._cookie.getValues<KeyType>(SettingType.KEY_CODES, new Set(keyTypes));
		keyCodes.forEach((value : string, type : KeyType) => {
			const code = Number(value);

			if (Number.isNaN(code) || code === 0) {
				return;
			}
			this.keyCodes.set(type, code);
		});

		const mouseCodes = this._cookie.getValues<KeyType>(SettingType.MOUSE_CODES, new Set(keyTypes));
		mouseCodes.forEach((value : string, type : KeyType) => {
			const code = Number(value);

			if (Number.isNaN(code)) {
				return;
			}
			this.mouseCodes.set(type, code);
		});

		this.loadSetting(SettingType.FULLSCREEN, <string[]> Object.values(FullscreenSetting), (value : string) => {
			this.fullscreenSetting = FullscreenSetting[value];
		});
		this.loadSetting(SettingType.CLIENT_PREDICTION, <string[]> Object.values(ClientPredictionSetting), (value : string) => {
			this.clientPredictionSetting = ClientPredictionSetting[value];
		});
		this.loadSetting(SettingType.DAMAGE_NUMBER, <string[]> Object.values(DamageNumberSetting), (value : string) => {
			this.damageNumberSetting = DamageNumberSetting[value];
		});
		this.loadSetting(SettingType.CHAT, <string[]> Object.values(ChatSetting), (value : string) => {
			this.chatSetting = ChatSetting[value];
		});
		this.loadSetting(SettingType.MOUSE_DOWN, <string[]> Object.values(ClickLockSetting), (value : string) => {
			this.clickLockSetting = ClickLockSetting[value];
		});
		this.loadSetting(SettingType.SCREEN_SHAKE, <string[]> Object.values(ScreenShakeSetting), (value : string) => {
			this.screenShakeSetting = ScreenShakeSetting[value];
		});

		this.loadSetting(SettingType.ANTI_ALIAS, <string[]> Object.values(AntiAliasSetting), (value : string) => {
			this.antiAliasSetting = AntiAliasSetting[value];
		});
		this.loadSetting(SettingType.SPEED, <string[]> Object.values(SpeedSetting), (value : string) => {
			this.speedSetting = SpeedSetting[value];
		});
		this.loadSetting(SettingType.SHADOW, <string[]> Object.values(ShadowSetting), (value : string) => {
			this.shadowSetting = ShadowSetting[value];
		});
		this.loadSetting(SettingType.SHADOW_FILTERING, <string[]> Object.values(ShadowFilteringSetting), (value : string) => {
			this.shadowFilteringSetting = ShadowFilteringSetting[value];
		});
		this.loadSetting(SettingType.TRANSPARENT, <string[]> Object.values(TransparentSetting), (value : string) => {
			this.transparentSetting = TransparentSetting[value];
		});

		this.loadSetting(SettingType.MUSIC, <string[]> Object.values(MusicSetting), (value : string) => {
			this.musicSetting = MusicSetting[value];
		});
		this.loadSetting(SettingType.SOUND, <string[]> Object.values(SoundSetting), (value : string) => {
			this.soundSetting = SoundSetting[value];
		});

		this.volumePercent = this._cookie.getNumberOr(SettingType.VOLUME_PERCENT, Settings._volumePercent);
		this.musicPercent = this._cookie.getNumberOr(SettingType.MUSIC_PERCENT, Settings._musicPercent);
		this.soundPercent = this._cookie.getNumberOr(SettingType.SOUND_PERCENT, Settings._soundPercent);
	}
	private loadSetting(type : SettingType, values : string[], cb : (value : string) => void) {
		if (this._cookie.has(type)) {
			const value = this._cookie.get(type);

			if (values.length === 0 || values.includes(value)) {
				cb(value);
			}
		}
	}

	setKeyCode(type : KeyType, code : number) : void {
		this.keyCodes.set(type, code);
	}
	keyCode(type : KeyType) : number {
		return this.keyCodes.has(type) ? this.keyCodes.get(type) : 0;
	}

	setMouseCode(type : KeyType, code : number) : void {
		this.mouseCodes.set(type, code);
	}
	mouseCode(type : KeyType) : number {
		return this.mouseCodes.has(type) ? this.mouseCodes.get(type) : -1;
	}

	recommendedGraphics() : void {
		this.antiAliasSetting = AntiAliasSetting.MEDIUM;
		this.speedSetting = SpeedSetting.NORMAL;
		this.shadowSetting = ShadowSetting.ON;
		this.shadowFilteringSetting = ShadowFilteringSetting.MEDIUM;
		this.transparentSetting = TransparentSetting.ON;
	}
	lowSpec() : void {
		this.recommendedGraphics();
		this.antiAliasSetting = AntiAliasSetting.LOW;
		this.shadowSetting = ShadowSetting.OFF;
		this.shadowFilteringSetting = ShadowFilteringSetting.LOW;
	}
	lowestSpec() : void {
		this.lowSpec();
		this.speedSetting = SpeedSetting.SLOW;
		this.transparentSetting = TransparentSetting.OFF;
	}

	fullscreen() : boolean { return this.fullscreenSetting === FullscreenSetting.FULLSCREEN; }
	showDamageNumbers() : boolean { return this.damageNumberSetting === DamageNumberSetting.ON; }
	showChat() : boolean { return this.chatSetting !== ChatSetting.OFF; }
	filterChat() : boolean { return this.chatSetting === ChatSetting.FILTER; }
	allowKeyLock(type : KeyType) : boolean {
		if (this.clickLockSetting === ClickLockSetting.ON && Settings._mouseLockKeys.has(type)) {
			return true;
		}
		return false;
	}
	shakeScreen() : boolean { return this.screenShakeSetting === ScreenShakeSetting.ON; }
	speed() : number{
		switch (this.speedSetting) {
		case SpeedSetting.SLOW:
			return 30;
		case SpeedSetting.FAST:
			return 120;
		default:
			return 60;
		}
	}

	fxaaSamples() : number {
		switch (this.antiAliasSetting) {
		case AntiAliasSetting.LOW:
			return 2;
		case AntiAliasSetting.MEDIUM:
			return 4;
		case AntiAliasSetting.HIGH:
			return 8;
		default:
			return 0;
		}
	}
	predictionTime() : number {
		if (!game.initialized() || game.isHost()) {
			return 0;
		}

		switch (this.clientPredictionSetting) {
		case ClientPredictionSetting.LOW:
			return 1000;
		case ClientPredictionSetting.MEDIUM:
			return 2000;
		case ClientPredictionSetting.HIGH:
			return 3000;
		default:
			return 0;
		}
	}
	transparentEffects() : boolean {
		return this.transparentSetting === TransparentSetting.ON;
	}
	musicVolume() : number {
		if (this.musicSetting === MusicSetting.OFF) {
			return 0;
		}

		return 0.7 * this.volumePercent * this.musicPercent;
	}
	soundVolume() : number {
		if (this.soundSetting === SoundSetting.OFF) {
			return 0;
		}

		return this.volumePercent * this.soundPercent;
	}

	useInspector() : boolean { return this.inspectorSetting === InspectorSetting.ON; }
	delay() : number {
		switch (this.delaySetting) {
		case DelaySetting.LAN:
			return 10;
		case DelaySetting.LOCAL:
			return 20;
		case DelaySetting.CONTINENT:
			return 50;
		case DelaySetting.GLOBAL:
			return 100;
		default:
			return 0;
		}
	}
	jitter() : number {
		switch (this.jitterSetting) {
		case JitterSetting.WIFI:
			return 8;
		case JitterSetting.POOR:
			return 40;
		case JitterSetting.TERRIBLE:
			return 200;
		default:
			return 0;
		}
	}
	sendSuccessRate() : number {
		switch (this.networkStabilitySetting) {
		case NetworkStabilitySetting.GOOD:
			return 0.995;
		case NetworkStabilitySetting.WIFI:
			return 0.98;
		case NetworkStabilitySetting.POOR:
			return 0.95;
		case NetworkStabilitySetting.TERRIBLE:
			return 0.8;
		default:
			return 1;
		}
	}
}

export const settings = new Settings();