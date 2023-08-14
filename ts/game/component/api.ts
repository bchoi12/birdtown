
export enum ComponentType {
	UNKNOWN,
	ASSOCIATION,
	ATTRIBUTES,
	CARDINALS,
	HEX_COLORS,
	MODEL,
	MODIFIERS,
	OPENINGS,
	PROFILE,
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
	GROUNDED,
	READY,
	SOLID,
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

export enum BoostType {
	UNKNOWN,

	ADD_BASE,
	MULT_BASE,
	ADD_BONUS,
	MULT_TOTAL,
}