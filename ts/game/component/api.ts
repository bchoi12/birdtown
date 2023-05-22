
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
	GROUNDED,
	PICKABLE,
	PICKED,
	READY,
	SOLID,

	// Integer
	OWNER,
	TEAM,
}
