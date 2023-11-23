
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

class Settings {
	
	public leftKeyCode : number;
	public rightKeyCode : number;
	public jumpKeyCode : number;
	public interactKeyCode : number;
	public squawkKeyCode : number;
	public mouseClickKeyCode : number;
	public altMouseClickKeyCode : number;

	public scoreboardKeyCode : number;
	public pauseKeyCode : number;
	public chatKeyCode : number;

	public fullscreenSetting : FullscreenSetting;
	public pointerSetting : PointerSetting;

	public gameSpeedSetting : SpeedSetting;
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

		this.pauseKeyCode = 27;
		this.chatKeyCode = 13;
		this.scoreboardKeyCode = 9;

		this.fullscreenSetting = FullscreenSetting.WINDOWED;
		this.pointerSetting = PointerSetting.NORMAL;

		this.gameSpeedSetting = SpeedSetting.AUTO;
		this.antiAliasSetting = AntiAliasSetting.MEDIUM;
		this.clientPredictionSetting = ClientPredictionSetting.LOW;

		// Debug properties
		this.inspectorSetting = InspectorSetting.OFF;
		this.delaySetting = DelaySetting.NONE;
		this.jitterSetting = JitterSetting.NONE;
		this.networkStabilitySetting = NetworkStabilitySetting.PERFECT;
	}

	fullscreen() : boolean { return this.fullscreenSetting === FullscreenSetting.FULLSCREEN; }
	pointerLocked() : boolean { return this.pointerSetting === PointerSetting.LOCKED; }

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
			return 250;
		case ClientPredictionSetting.MEDIUM:
			return 500;
		case ClientPredictionSetting.HIGH:
			return 1000;
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