
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

	CLASS,
}

export enum ModifierClassType {
	UNKNOWN,

	NONE,
	BIG,
	FAST,
	SHARP,
}

export enum StatType {
	UNKNOWN,

	HEALTH,
}