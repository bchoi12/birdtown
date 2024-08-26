
export enum ComponentType {
	UNKNOWN,
	ASSOCIATION,
	ATTRIBUTES,
	CARDINALS,
	COUNTERS,
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
	TRANSFORMS,
}

export enum AssociationType {
	UNKNOWN,

	OWNER,
	TEAM,
}

export enum AttributeType {
	UNKNOWN,

	BRAINED,
	CHARGING,
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

// TODO: move to ui/api
export enum CounterType {
	UNKOWN,
	CHARGE,
	DASH,
	BULLETS,
	HEALTH,
	JETPACK,
	JUICE,
	ROCKET,
	ROLL,
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