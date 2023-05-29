
export enum ComponentType {
	UNKNOWN,
	ATTRIBUTES,
	CARDINALS,
	HEALTH,
	HEX_COLORS,
	MODEL,
	OPENINGS,
	PROFILE,
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
