
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

	export const archBackgroundRed = HexColor.fromHex(0xcc807a);
	export const archBackgroundOrange = HexColor.fromHex(0xccab7a);
	export const archBackgroundYellow = HexColor.fromHex(0xcccc7a);
	export const archBackgroundGreen = HexColor.fromHex(0x8fcc7a);
	export const archBackgroundBlue = HexColor.fromHex(0x7aa3cc);
	export const archBackgroundPurple = HexColor.fromHex(0xaa7acc);

	export const bazookaRed = HexColor.fromHex(0xdc5a3a);

	export const boltBlue = HexColor.fromHex(0x7cf2f0);
	export const boltOrange = HexColor.fromHex(0xffb163);
	export const boltExplosion = HexColor.fromHex(0xffc361);

	export const crateBlue = HexColor.fromHex(0x3c5ffa);
	export const crateRed = HexColor.fromHex(0xfa493c);
	export const crateYellow = HexColor.fromHex(0xf6ff56);

	export const playerRed = HexColor.fromHex(0xfc1f0f);
	export const playerOrange = HexColor.fromHex(0xfcb10f);
	export const playerYellow = HexColor.fromHex(0xfcf40f);
	export const playerGreen = HexColor.fromHex(0x1bfc0f);
	export const playerAqua = HexColor.fromHex(0x0ffce8);
	export const playerBlue = HexColor.fromHex(0x0f52fc);
	export const playerPurple = HexColor.fromHex(0xa50ffc);
	export const playerPink = HexColor.fromHex(0xfc0fbd);
	export const playerWhite = HexColor.fromHex(0xfbfbfb);
	export const playerColors = [
		playerRed, playerOrange, playerYellow,
		playerGreen, playerAqua, playerBlue,
		playerPurple, playerPink, playerWhite,
	];

	export const signGray = HexColor.fromHex(0x8b8b8b);

	export const sparkBlue = HexColor.fromHex(0xc2f8ff);

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

	export function playerColor(id : number) : HexColor {
		return playerColors[Math.abs(id - 1) % playerColors.length];
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