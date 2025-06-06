
export enum ComponentType {
	UNKNOWN,
	ASSOCIATION,
	ATTRIBUTES,
	CARDINALS,
	ENTITY_TRACKER,
	ENTITY_TRACKERS,
	EXPRESSION,
	HEX_COLORS,
	MODEL,
	OPENINGS,
	PROFILE,
	SOUND_PLAYER,
	STAT,
	STATS,
}

export enum AssociationType {
	UNKNOWN,

	OWNER,
	TEAM,
}

export enum AttributeType {
	UNKNOWN,

	BRAINED,
	CHARGED,
	FLOATING,
	GROUNDED,
	INVINCIBLE,
	REVIVING,
	SOLID,
	VIP,
}

export enum EmotionType {
	UNKNOWN,

	NORMAL,
	MAD,
	SAD,
	DEAD,
}

export enum StatType {
	UNKNOWN,

	HEALTH,
	SCALING,
}