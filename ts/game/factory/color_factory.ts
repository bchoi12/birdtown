
import { EntityType } from 'game/entity/api'
import { ColorType } from 'game/factory/api'

import { Buffer } from 'util/buffer'
import { HexColor } from 'util/hex_color'
import { SeededRandom } from 'util/seeded_random'

export type ColorMap = Map<number, HexColor>;

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
	export const archWhite = HexColor.fromHex(0xeeeeee);

	export const boltBlue = HexColor.fromHex(0x7cf2f0);
	export const boltOrange = HexColor.fromHex(0xffb163);

	export const sparkBlue = HexColor.fromHex(0x9ef4ff);
	export const sparkOrange = HexColor.fromHex(0xffd79e);

	export const baseColors = new Map<EntityType, Buffer<HexColor>>([
		[EntityType.ARCH_BLOCK, Buffer.from(archRed, archOrange, archYellow, archGreen, archBlue, archPurple)],
	]);

	export function shuffleColors(type : EntityType, rng? : SeededRandom) : void {
		if (!baseColors.has(type)) {
			return;
		}
		baseColors.get(type).shuffle(rng);
	}

	export function generateColorMap(type : EntityType, index? : number) : ColorMap {
		if (!index || index < 0 ) { index = 0; }

		switch (type) {
		case EntityType.ARCH_BLOCK:
			return new Map([
				[ColorType.BASE, color(EntityType.ARCH_BLOCK, index)],
				[ColorType.SECONDARY, archWhite],
			]);
		default:
			console.error("Warning: empty color map generated for %d", type);
			return new Map();
		}
	}

	function color(type : EntityType, index : number) : HexColor {
		if (!baseColors.has(type)) {
			console.error("Warning: missing colors for type %d", type);
			return black;
		}
		const colors = baseColors.get(type);
		return colors.get(index % colors.size());
	}
}