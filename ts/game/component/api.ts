
export enum ComponentType {
	UNKNOWN,
	ATTRIBUTES,
	CARDINALS,
	HEX_COLORS,
	MODEL,
	OPENINGS,
	PROFILE,
	STAT,
	STATS,
}

export enum AttributeType {
	UNKNOWN,

	// Boolean
	BRAINED,
	GROUNDED,
	READY,
	SOLID,

	// Integer
	OWNER,
	TEAM,
}

export enum StatType {
	UNKNOWN,

	HEALTH,
}