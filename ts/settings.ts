
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

import { isElectron, isMobile } from 'util/common'

class Settings {
	
	public leftKeyCode : number;
	public rightKeyCode : number;
	public jumpKeyCode : number;
	public interactKeyCode : number;
	public squawkKeyCode : number;
	public mouseClickKeyCode : number;
	public altMouseClickKeyCode : number;

	public scoreboardKeyCode : number;
	public menuKeyCode : number;
	public chatKeyCode : number;
	public pointerLockKeyCode : number;

	public fullscreenSetting : FullscreenSetting;

	public fpsSetting : SpeedSetting;
	public antiAliasSetting : AntiAliasSetting;
	public clientPredictionSetting : ClientPredictionSetting;

	public inspectorSetting : InspectorSetting;
	public delaySetting : DelaySetting;
	public jitterSetting : JitterSetting;
	public networkStabilitySetting : NetworkStabilitySetting;

	constructor() {
		this.leftKeyCode = 65;
		this.rightKeyCode = 68;
		this.jumpKeyCode = 32;
		this.interactKeyCode = 69;
		this.squawkKeyCode = 81;
		this.mouseClickKeyCode = 83;
		this.altMouseClickKeyCode = 16;

		this.menuKeyCode = 27;
		this.chatKeyCode = 13;
		this.scoreboardKeyCode = 9;
		this.pointerLockKeyCode = 67;

		this.fullscreenSetting = (isMobile() || isElectron()) ? FullscreenSetting.FULLSCREEN : FullscreenSetting.WINDOWED;

		this.fpsSetting = isMobile() ? SpeedSetting.SLOW : SpeedSetting.NORMAL;
		this.antiAliasSetting = isMobile() ? AntiAliasSetting.NONE : AntiAliasSetting.MEDIUM;
		this.clientPredictionSetting = isMobile() ? ClientPredictionSetting.HIGH : ClientPredictionSetting.MEDIUM;

		// Debug properties
		this.inspectorSetting = InspectorSetting.OFF;
		this.delaySetting = DelaySetting.NONE;
		this.jitterSetting = JitterSetting.NONE;
		this.networkStabilitySetting = NetworkStabilitySetting.PERFECT;
	}

	fullscreen() : boolean { return this.fullscreenSetting === FullscreenSetting.FULLSCREEN; }

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
		switch (this.clientPredictionSetting) {
		case ClientPredictionSetting.LOW:
			return 500;
		case ClientPredictionSetting.MEDIUM:
			return 1000;
		case ClientPredictionSetting.HIGH:
			return 2000;
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
			return 30;
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
			return 20;
		case JitterSetting.POOR:
			return 100;
		case JitterSetting.TERRIBLE:
			return 300;
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