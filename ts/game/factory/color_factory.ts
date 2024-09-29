
import { EntityType } from 'game/entity/api'
import { ColorCategory, ColorType } from 'game/factory/api'

import { Buffer } from 'util/buffer'
import { HexColor } from 'util/hex_color'
import { SeededRandom } from 'util/seeded_random'

export namespace ColorFactory {

	const colorMap = new Map<ColorType, HexColor>([
		// Basic series
		[ColorType.WHITE, HexColor.fromHex(0xffffff)],
		[ColorType.GRAY, HexColor.fromHex(0x808080)],
		[ColorType.BLACK, HexColor.fromHex(0x0)],
		[ColorType.RED, HexColor.fromHex(0xff0000)],
		[ColorType.YELLOW, HexColor.fromHex(0xffff00)],
		[ColorType.GREEN, HexColor.fromHex(0x00ff00)],
		[ColorType.BLUE, HexColor.fromHex(0x0000ff)],
		[ColorType.PURPLE, HexColor.fromHex(0xff00ff)],
		[ColorType.AQUA, HexColor.fromHex(0x00ffff)],

		// Level series (bright, not too saturated)
		[ColorType.LEVEL_RED, HexColor.fromHex(0xfc1f0f)],
		[ColorType.LEVEL_ORANGE, HexColor.fromHex(0xfc910f)],
		[ColorType.LEVEL_YELLOW, HexColor.fromHex(0xede328)],
		[ColorType.LEVEL_GREEN, HexColor.fromHex(0x0ffc89)],
		[ColorType.LEVEL_BLUE, HexColor.fromHex(0x0fdcfc)],
		[ColorType.LEVEL_PURPLE, HexColor.fromHex(0x901bf2)],
		[ColorType.LEVEL_BROWN, HexColor.fromHex(0xa1662f)],
		[ColorType.LEVEL_WHITE, HexColor.fromHex(0xeeeeee)],
		[ColorType.LEVEL_GRAY, HexColor.fromHex(0x8b8b8b)],
		[ColorType.LEVEL_BLACK, HexColor.fromHex(0x111111)],

		// Background series (minimal saturation)
		[ColorType.LEVEL_BACKGROUND_RED, HexColor.fromHex(0xb36f69)],
		[ColorType.LEVEL_BACKGROUND_ORANGE, HexColor.fromHex(0xccab7a)],
		[ColorType.LEVEL_BACKGROUND_YELLOW, HexColor.fromHex(0xcccc7a)],
		[ColorType.LEVEL_BACKGROUND_GREEN, HexColor.fromHex(0x78a36c)],
		[ColorType.LEVEL_BACKGROUND_BLUE, HexColor.fromHex(0x7aa3cc)],
		[ColorType.LEVEL_BACKGROUND_PURPLE, HexColor.fromHex(0x9168ad)],

		// Player series (not too saturated, but distinct from level)
		[ColorType.PLAYER_RED, HexColor.fromHex(0xfc1f0f)],
		[ColorType.PLAYER_ORANGE, HexColor.fromHex(0xfcb10f)],
		[ColorType.PLAYER_YELLOW, HexColor.fromHex(0xfcf40f)],
		[ColorType.PLAYER_GREEN, HexColor.fromHex(0x1bfc0f)],
		[ColorType.PLAYER_AQUA, HexColor.fromHex(0x0ffce8)],
		[ColorType.PLAYER_BLUE, HexColor.fromHex(0x0f52fc)],
		[ColorType.PLAYER_PURPLE, HexColor.fromHex(0xa50ffc)],
		[ColorType.PLAYER_PINK, HexColor.fromHex(0xfc0fbd)],
		[ColorType.PLAYER_WHITE, HexColor.fromHex(0xfbfbfb)],

		// Western series (rugged?)
		[ColorType.WESTERN_YELLOW, HexColor.fromHex(0xffef61)],
		[ColorType.WESTERN_BROWN, HexColor.fromHex(0x966336)],
		[ColorType.WESTERN_BLACK, HexColor.fromHex(0x1c1a18)],

		// Eastern series (showy?)
		[ColorType.EASTERN_PURPLE, HexColor.fromHex(0x7d3abf)],

		// Blaster series (bold, darker colors)
		[ColorType.BLASTER_RED, HexColor.fromHex(0xbd2804)],
		[ColorType.BLASTER_YELLOW, HexColor.fromHex(0xf4fa4b)],

		// Shooter series (sleek, lighter colors)
		[ColorType.SHOOTER_BLUE, HexColor.fromHex(0x7cf2f0)],
		[ColorType.SHOOTER_LIGHT_BLUE, HexColor.fromHex(0xc7fffe)],
		[ColorType.SHOOTER_ORANGE, HexColor.fromHex(0xffb163)],
		[ColorType.SHOOTER_DARK_ORANGE, HexColor.fromHex(0xe68525)],
		[ColorType.SHOOTER_LIGHT_ORANGE, HexColor.fromHex(0xffe6d4)],
		[ColorType.SHOOTER_YELLOW, HexColor.fromHex(0xffef61)],

		// Pickup series (saturated, stand out from level)
		[ColorType.PICKUP_BLUE, HexColor.fromHex(0x3c5ffa)],
		[ColorType.PICKUP_RED, HexColor.fromHex(0xfa493c)],
		[ColorType.PICKUP_YELLOW, HexColor.fromHex(0xf6ff56)],

		// Environment series
		[ColorType.SKY_DAY_TOP, HexColor.fromHex(0xdef1ff)],
		[ColorType.SKY_DAY_BOTTOM, HexColor.fromHex(0xf3fbff)],
		[ColorType.SKY_EVENING_TOP, HexColor.fromHex(0xffdbc2)],
		[ColorType.SKY_EVENING_BOTTOM, HexColor.fromHex(0xffe7d6)],
		[ColorType.SKY_NIGHT_TOP, HexColor.fromHex(0x004f8a)],
		[ColorType.SKY_NIGHT_BOTTOM, HexColor.fromHex(0x003d6b)],

		// Particle series (light and works well with opacity)
		[ColorType.PARTICLE_RED, HexColor.fromHex(0xdc5a3a)],
		[ColorType.PARTICLE_BLUE, HexColor.fromHex(0xc2f8ff)],
		[ColorType.PARTICLE_YELLOW, HexColor.fromHex(0xfff6c2)],
		[ColorType.PARTICLE_PURPLE, HexColor.fromHex(0xa465e2)],
		[ColorType.PARTICLE_ORANGE, HexColor.fromHex(0xffc361)],

		// Material series
		[ColorType.SWEAT, HexColor.fromHex(0xe3fcff)],
		[ColorType.TABLE, HexColor.fromHex(0xc98f40)],
		[ColorType.WINDOW, HexColor.fromHex(0xa8ccd7)],
	]);

	const entityColorMap = new Map<EntityType, Array<ColorType>>([
		[EntityType.ARCH_BLOCK, [
			ColorType.LEVEL_RED, ColorType.LEVEL_ORANGE, ColorType.LEVEL_YELLOW,
			ColorType.LEVEL_GREEN, ColorType.LEVEL_BLUE, ColorType.LEVEL_PURPLE
		]],
		[EntityType.BAZOOKA, [ColorType.BLASTER_RED, ColorType.BLASTER_YELLOW]],
		[EntityType.BOOSTER, [ColorType.SHOOTER_BLUE, ColorType.SHOOTER_YELLOW]],
		[EntityType.CLAW, [ColorType.EASTERN_PURPLE]],
		[EntityType.COWBOY_HAT, [ColorType.WESTERN_BROWN]],
		[EntityType.GATLING, [ColorType.WESTERN_YELLOW]],
		[EntityType.HEADBAND, [ColorType.EASTERN_PURPLE]],
		[EntityType.HEADPHONES, [ColorType.SHOOTER_YELLOW]],
		[EntityType.JETPACK, [ColorType.BLASTER_RED]],
		[EntityType.PISTOL, [ColorType.WESTERN_BLACK]],
		[EntityType.SCOUTER, [ColorType.SHOOTER_ORANGE]],
		[EntityType.SHOTGUN, [ColorType.WESTERN_BROWN]],
		[EntityType.SNIPER, [ColorType.SHOOTER_BLUE]],
		[EntityType.PLAYER, [
			ColorType.PLAYER_RED, ColorType.PLAYER_ORANGE, ColorType.PLAYER_YELLOW,
			ColorType.PLAYER_GREEN, ColorType.PLAYER_AQUA, ColorType.PLAYER_BLUE,
			ColorType.PLAYER_PURPLE, ColorType.PLAYER_PINK, ColorType.PLAYER_WHITE,
		]],
	]);

	export function color(type : ColorType) : HexColor {
		return colorMap.get(type);
	}
	export function entityColors(type : EntityType) : Array<ColorType> {
		if (!entityColorMap.has(type)) {
			console.error("Warning: missing colors for", EntityType[type]);
			return [];
		}
		return entityColorMap.get(type);
	}
	export function entityColor(type : EntityType, index? : number) : HexColor {
		if (!entityColorMap.has(type)) {
			console.error("Warning: missing colors for", EntityType[type]);
			return colorMap.get(ColorType.WHITE);
		}
		if (!index) {
			index = 0;
		}
		const colorTypes = entityColorMap.get(type);
		return colorMap.get(colorTypes[index % colorTypes.length]);
	}
	export function shuffleEntityColors(type : EntityType, rng : SeededRandom) : void {
		if (!entityColorMap.has(type)) {
			console.error("Warning: missing colors for", EntityType[type]);
			return;
		}

		rng.shuffle(entityColorMap.get(type));
	}
}