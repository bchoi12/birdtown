
import { EntityType } from 'game/entity'

import { HexColor } from 'util/hex_color'

export enum ColorType {
	UNKNOWN,
	BASE,
	SECONDARY,
}

export namespace ColorRepository {

	export const white = new HexColor(0xffffff);
	export const black = new HexColor(0x0);

	export const archRed = new HexColor(0xfc1f0f);
	export const archOrange = new HexColor(0xfc910f);
	export const archYellow = new HexColor(0xfcf40f);
	export const archGreen = new HexColor(0x0ffc89);
	export const archBlue = new HexColor(0x0fdcfc);
	export const archPurple = new HexColor(0x910ffc);
	export const archWhite = new HexColor(0xfbfbfb);

	export const baseColors = new Map<EntityType, Array<HexColor>>([
		[EntityType.ARCH_BASE, new Array(archRed, archOrange, archYellow, archGreen, archBlue, archPurple)],
	]);

	export function generateColorMap(type : EntityType, seed? : number) : Map<number, HexColor> {
		if (!seed || seed <= 0) { seed = 0; }

		switch (type) {
		case EntityType.ARCH_ROOM:
		case EntityType.ARCH_ROOF:
			return new Map([
				[ColorType.BASE, getColor(EntityType.ARCH_BASE, seed)],
				[ColorType.SECONDARY, archWhite],
			]);
		default:
			console.error("Warning: empty color map generated for %d", type);
			return new Map();
		}
	}

	function getColor(type : EntityType, seed : number) : HexColor {
		if (!baseColors.has(type)) {
			console.error("Warning: missing colors for type %d", type);
			return black;
		}
		const colors = baseColors.get(type);
		return colors[seed % colors.length];
	}
}