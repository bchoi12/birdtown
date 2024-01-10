
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
	GROUNDED,
	READY,
	SOLID,
}

export enum BoostType {
	UNKNOWN,

	ADD_BASE,
	MULT_BASE,
	ADD_BONUS,
	MULT_TOTAL,
}

export enum CounterType {
	UNKOWN,
	CHARGE,
	HEALTH,
	JUICE,
	ROCKET,
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