
// Do not reorder to preserve backwards compatibility
export enum SettingType {
	UNKNOWN,

	TOKEN,
	KEY_CODES,

	FULLSCREEN,
	CLIENT_PREDICTION,
	DAMAGE_NUMBER,
	PROFANITY_FILTER,
	SCREEN_SHAKE,

	MUSIC,
	MUSIC_PERCENT,
	SOUND,
	SOUND_PERCENT,

	ANTI_ALIAS,
	SPEED,
	SHADOW,
	SHADOW_FILTERING,
	TRANSPARENT,
}

export enum AntiAliasSetting {
	NONE,
	LOW,
	MEDIUM,
	HIGH,
}

export enum ClientPredictionSetting {
	NONE,
	LOW,
	MEDIUM,
	HIGH,
}

export enum DamageNumberSetting {
	OFF,
	ON,
}

export enum ShadowFilteringSetting {
	NONE,
	LOW,
	MEDIUM,
	HIGH,
}

export enum FullscreenSetting {
	WINDOWED,
	FULLSCREEN,
}

export enum MusicSetting {
	OFF,
	ON,
}

export enum PointerSetting {
	NORMAL,
	LOCKED,
}

export enum ProfanityFilterSetting {
	OFF,
	ON,
}

export enum ScreenShakeSetting {
	OFF,
	ON,
}

export enum ShadowSetting {
	OFF,
	ON,
}

export enum SpeedSetting {
	SLOW,
	NORMAL,
}

export enum SoundSetting {
	OFF,
	ON,
}

export enum TransparentSetting {
	OFF,
	ON,
}

export enum InspectorSetting {
	OFF,
	ON,
}

export enum DelaySetting {
	NONE,
	LAN,
	LOCAL,
	CONTINENT,
	GLOBAL,
}

export enum JitterSetting {
	NONE,
	WIFI,
	POOR,
	TERRIBLE,
}

export enum NetworkStabilitySetting {
	PERFECT,
	GOOD,
	WIFI,
	POOR,
	TERRIBLE,
}