
import { EntityType } from 'game/entity'

import { HexColor } from 'util/hex_color'

export enum ColorType {
	UNKNOWN,
	BASE,
	SECONDARY,
}

export namespace ColorFactory {

	export const white = HexColor.fromHex(0xffffff);
	export const black = HexColor.fromHex(0x0);

	export const transparentWindow = HexColor.fromHex(0xa8ccd7);

	export const archRed = HexColor.fromHex(0xfc1f0f);
	export const archOrange = HexColor.fromHex(0xfc910f);
	export const archYellow = HexColor.fromHex(0xfcf40f);
	export const archGreen = HexColor.fromHex(0x0ffc89);
	export const archBlue = HexColor.fromHex(0x0fdcfc);
	export const archPurple = HexColor.fromHex(0x910ffc);
	export const archWhite = HexColor.fromHex(0xfbfbfb);

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