
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
	MODIFIERS,
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
	SOLID,
}

export enum BoostType {
	UNKNOWN,

	ADD_BASE,
	MULT_BASE,
	ADD_BONUS,
	MULT_TOTAL,
}

export enum ModifierType {
	UNKNOWN,

	PLAYER_TYPE,
}

export enum ModifierPlayerType {
	UNKNOWN,

	NONE,
	BIG,
	FAST,
	SHARP,
}

export enum StatType {
	UNKNOWN,

	HEALTH,
	SCALING,
}