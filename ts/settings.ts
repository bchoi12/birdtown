
import { game } from 'game'
import {
	AntiAliasSetting,
	ClientPredictionSetting,
	DamageNumberSetting,
	FullscreenSetting,
	FilteringQuality,
	PointerSetting,
	ShadowSetting,
	SpeedSetting,

	DelaySetting,
	JitterSetting,
	InspectorSetting,
	NetworkStabilitySetting,
} from 'settings/api'

import { KeyType } from 'ui/api'

import { isElectron, isMobile, isLocalhost } from 'util/common'

class Settings {
	
	// Key codes
	public keyCodes : Map<KeyType, number>;
	public scoreboardKeyCode : number;
	public menuKeyCode : number;
	public chatKeyCode : number;
	public pointerLockKeyCode : number;

	// Gameplay
	public fullscreenSetting : FullscreenSetting;
	public fpsSetting : SpeedSetting;
	public clientPredictionSetting : ClientPredictionSetting;
	public damageNumberSetting : DamageNumberSetting;
	public volume : number;

	// Graphics
	public antiAliasSetting : AntiAliasSetting;
	public shadowEnabled : ShadowSetting;
	public shadowFiltering : FilteringQuality;

	// Debug properties
	public inspectorSetting : InspectorSetting;
	public delaySetting : DelaySetting;
	public jitterSetting : JitterSetting;
	public networkStabilitySetting : NetworkStabilitySetting;

	constructor() {
		this.keyCodes = new Map();
		this.keyCodes.set(KeyType.LEFT, 65);
		this.keyCodes.set(KeyType.RIGHT, 68);
		this.keyCodes.set(KeyType.JUMP, 32);
		this.keyCodes.set(KeyType.INTERACT, 69);
		this.keyCodes.set(KeyType.SQUAWK, 81);
		this.keyCodes.set(KeyType.MOUSE_CLICK, 83);
		this.keyCodes.set(KeyType.ALT_MOUSE_CLICK, 16);

		this.menuKeyCode = 27;
		this.chatKeyCode = 13;
		this.scoreboardKeyCode = 9;
		this.pointerLockKeyCode = 67;

		this.fullscreenSetting = (isMobile() || isElectron()) ? FullscreenSetting.FULLSCREEN : FullscreenSetting.WINDOWED;
		this.fpsSetting = isMobile() ? SpeedSetting.SLOW : SpeedSetting.NORMAL;
		this.clientPredictionSetting = isMobile() ? ClientPredictionSetting.HIGH : ClientPredictionSetting.MEDIUM;
		this.damageNumberSetting = DamageNumberSetting.OFF;
		this.volume = 0.8;

		this.antiAliasSetting = isMobile() ? AntiAliasSetting.LOW : AntiAliasSetting.MEDIUM;
		this.shadowEnabled = isMobile() ? ShadowSetting.OFF : ShadowSetting.ON;
		this.shadowFiltering = isMobile() ? FilteringQuality.NONE : FilteringQuality.MEDIUM;

		this.inspectorSetting = InspectorSetting.OFF;
		this.delaySetting = isLocalhost() ? DelaySetting.LOCAL : DelaySetting.NONE;
		this.jitterSetting = isLocalhost() ? JitterSetting.WIFI : JitterSetting.NONE;
		this.networkStabilitySetting = isLocalhost() ? NetworkStabilitySetting.GOOD : NetworkStabilitySetting.PERFECT;
	}

	keyCode(type : KeyType) : number { return this.keyCodes.get(type); }

	fullscreen() : boolean { return this.fullscreenSetting === FullscreenSetting.FULLSCREEN; }
	showDamageNumbers() : boolean { return this.damageNumberSetting === DamageNumberSetting.ON; }

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

	// TODO: save and load from cookie
}

export const settings = new Settings();