
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

		// Arch series (bright, not too saturated)
		[ColorType.ARCH_RED, HexColor.fromHex(0xfc1f0f)],
		[ColorType.ARCH_ORANGE, HexColor.fromHex(0xfc910f)],
		[ColorType.ARCH_YELLOW, HexColor.fromHex(0xede328)],
		[ColorType.ARCH_GREEN, HexColor.fromHex(0x0ffc89)],
		[ColorType.ARCH_BLUE, HexColor.fromHex(0x0fdcfc)],
		[ColorType.ARCH_PURPLE, HexColor.fromHex(0x901bf2)],
		[ColorType.ARCH_BROWN, HexColor.fromHex(0xa1662f)],
		[ColorType.ARCH_WHITE, HexColor.fromHex(0xeeeeee)],
		[ColorType.ARCH_GRAY, HexColor.fromHex(0x8b8b8b)],
		[ColorType.ARCH_BLACK, HexColor.fromHex(0x111111)],

		// Background series (minimal saturation)
		[ColorType.ARCH_BACKGROUND_RED, HexColor.fromHex(0xb36f69)],
		[ColorType.ARCH_BACKGROUND_ORANGE, HexColor.fromHex(0xccab7a)],
		[ColorType.ARCH_BACKGROUND_YELLOW, HexColor.fromHex(0xcccc7a)],
		[ColorType.ARCH_BACKGROUND_GREEN, HexColor.fromHex(0x78a36c)],
		[ColorType.ARCH_BACKGROUND_BLUE, HexColor.fromHex(0x7aa3cc)],
		[ColorType.ARCH_BACKGROUND_PURPLE, HexColor.fromHex(0x9168ad)],

		[ColorType.CLIFF_BROWN, HexColor.fromHex(0x74402B)],
		[ColorType.CLIFF_LIGHT_BROWN, HexColor.fromHex(0xE7C098)],
		[ColorType.CLIFF_PLATFORM, HexColor.fromHex(0xbf9569)],
		[ColorType.CLIFF_GRAY, HexColor.fromHex(0x4b4b4b)],
		[ColorType.CLIFF_DARK_GRAY, HexColor.fromHex(0x121212)],
		[ColorType.CLIFF_LIGHT_GRAY, HexColor.fromHex(0x8f8f8f)],

		[ColorType.TREE_LIGHT_GREEN, HexColor.fromHex(0x63B98A)],
		[ColorType.TREE_GREEN, HexColor.fromHex(0x2e5c2f)],
		[ColorType.TREE_DARK_GREEN, HexColor.fromHex(0x263826)],
		[ColorType.TREE_RED, HexColor.fromHex(0xde5959)],
		[ColorType.TREE_ORANGE, HexColor.fromHex(0xedb55a)],
		[ColorType.TREE_YELLOW, HexColor.fromHex(0xf5f495)],
		[ColorType.TREE_PURPLE, HexColor.fromHex(0xb659de)],
		[ColorType.TREE_BROWN, HexColor.fromHex(0x5D382C)],
		[ColorType.TREE_WHITE, HexColor.fromHex(0xf2d7ce)],

		// Player series (not too saturated, but distinct from level)
		[ColorType.PLAYER_RED, HexColor.fromHex(0xfc1f0f)],
		[ColorType.PLAYER_ORANGE, HexColor.fromHex(0xfcb10f)],
		[ColorType.PLAYER_GOLD, HexColor.fromHex(0xffd700)],
		[ColorType.PLAYER_YELLOW, HexColor.fromHex(0xfcf40f)],
		[ColorType.PLAYER_LIME, HexColor.fromHex(0x1bfc0f)],
		[ColorType.PLAYER_GREEN, HexColor.fromHex(0x29cc21)],
		[ColorType.PLAYER_TEAL, HexColor.fromHex(0x21cc9c)],
		[ColorType.PLAYER_AQUA, HexColor.fromHex(0x0ffce8)],
		[ColorType.PLAYER_BLUE, HexColor.fromHex(0x3d74ff)],
		[ColorType.PLAYER_PURPLE, HexColor.fromHex(0xa50ffc)],
		[ColorType.PLAYER_PINK, HexColor.fromHex(0xfc0fbd)],
		[ColorType.PLAYER_BROWN, HexColor.fromHex(0x7d4d1a)],
		[ColorType.PLAYER_WHITE, HexColor.fromHex(0xfbfbfb)],
		[ColorType.PLAYER_GRAY, HexColor.fromHex(0x8b8b8b)],
		[ColorType.PLAYER_BLACK, HexColor.fromHex(0x3b3b3b)],

		// Western series (rugged?)
		[ColorType.WESTERN_YELLOW, HexColor.fromHex(0xffef61)],
		[ColorType.WESTERN_BROWN, HexColor.fromHex(0x966336)],
		[ColorType.WESTERN_LIGHT_BROWN, HexColor.fromHex(0xc78b56)],
		[ColorType.WESTERN_BLACK, HexColor.fromHex(0x2c2a28)],

		// Eastern series (showy?)
		[ColorType.EASTERN_BLACK, HexColor.fromHex(0x2e2e2e)],
		[ColorType.EASTERN_PURPLE, HexColor.fromHex(0x7d3abf)],
		[ColorType.EASTERN_RED, HexColor.fromHex(0xbc3a3a)],

		// Blaster series (bold, darker colors)
		[ColorType.BLASTER_RED, HexColor.fromHex(0xbd2804)],
		[ColorType.BLASTER_YELLOW, HexColor.fromHex(0xf4fa4b)],

		// Shooter series (sleek, lighter colors)
		[ColorType.SHOOTER_DARK_BLUE, HexColor.fromHex(0x1f75ad)],
		[ColorType.SHOOTER_BLUE, HexColor.fromHex(0x7cf2f0)],
		[ColorType.SHOOTER_LIGHT_BLUE, HexColor.fromHex(0xc7fffe)],
		[ColorType.SHOOTER_ORANGE, HexColor.fromHex(0xffb163)],
		[ColorType.SHOOTER_DARK_ORANGE, HexColor.fromHex(0xe68525)],
		[ColorType.SHOOTER_YELLOW, HexColor.fromHex(0xe6d753)],

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
		[ColorType.PARTICLE_ORANGE, HexColor.fromHex(0xffc361)],
		[ColorType.PARTICLE_YELLOW, HexColor.fromHex(0xfdff8a)],
		[ColorType.PARTICLE_BLUE, HexColor.fromHex(0xc2f8ff)],
		[ColorType.PARTICLE_PURPLE, HexColor.fromHex(0xa465e2)],

		[ColorType.TEXT_RED, HexColor.fromHex(0xdc3a3a)],
		[ColorType.TEXT_GREEN, HexColor.fromHex(0x3adc70)],

		// UI colors
		[ColorType.UI_GREEN, HexColor.fromHex(0x46b363)],
		[ColorType.UI_GREENISH, HexColor.fromHex(0x80b346)],
		[ColorType.UI_YELLOW, HexColor.fromHex(0xb3b346)],
		[ColorType.UI_ORANGE, HexColor.fromHex(0xb37246)],
		[ColorType.UI_RED, HexColor.fromHex(0xb34646)],

		// Material series
		[ColorType.SWEAT, HexColor.fromHex(0xe3fcff)],
		[ColorType.TABLE, HexColor.fromHex(0xc98f40)],
		[ColorType.WINDOW, HexColor.fromHex(0xa8ccd7)],
		[ColorType.WATER, HexColor.fromHex(0x92dff7)],
	]);

	const entityColorMap = new Map<EntityType, Array<ColorType>>([
		[EntityType.ARCH_BLOCK, [
			ColorType.ARCH_RED, ColorType.ARCH_ORANGE, ColorType.ARCH_YELLOW,
			ColorType.ARCH_GREEN, ColorType.ARCH_BLUE, ColorType.ARCH_PURPLE
		]],
		[EntityType.BAZOOKA, [ColorType.BLASTER_RED, ColorType.BLASTER_YELLOW]],
		[EntityType.BLACK_HEADBAND, [ColorType.EASTERN_BLACK]],
		[EntityType.BOOSTER, [ColorType.SHOOTER_BLUE, ColorType.SHOOTER_YELLOW]],
		[EntityType.COWBOY_HAT, [ColorType.WESTERN_BROWN]],
		[EntityType.GATLING, [ColorType.SHOOTER_DARK_BLUE, ColorType.SHOOTER_BLUE]],
		[EntityType.GOLDEN_GUN, [ColorType.WESTERN_YELLOW]],
		[EntityType.HEADPHONES, [ColorType.SHOOTER_YELLOW]],
		[EntityType.JETPACK, [ColorType.BLASTER_RED]],
		[EntityType.LASER_GUN, [ColorType.SHOOTER_BLUE]],
		[EntityType.MINIGUN, [ColorType.EASTERN_BLACK]],
		[EntityType.ORB_CANNON, [ColorType.SHOOTER_YELLOW]],
		[EntityType.PISTOL, [ColorType.WESTERN_BLACK]],
		[EntityType.POCKET_ROCKET, [ColorType.WHITE]],
		[EntityType.PURPLE_GLOVE, [ColorType.EASTERN_PURPLE]],
		[EntityType.PURPLE_HEADBAND, [ColorType.EASTERN_PURPLE]],
		[EntityType.RED_GLOVE, [ColorType.EASTERN_RED]],
		[EntityType.RED_HEADBAND, [ColorType.EASTERN_RED]],
		[EntityType.RIFLE, [ColorType.WESTERN_LIGHT_BROWN]],
		[EntityType.SCOUTER, [ColorType.SHOOTER_ORANGE]],
		[EntityType.SHOTGUN, [ColorType.WESTERN_BROWN]],
		[EntityType.TOP_HAT, [ColorType.BLACK]],
		[EntityType.WING_CANNON, [ColorType.SHOOTER_ORANGE]],
		[EntityType.PLAYER, [
			ColorType.PLAYER_RED, ColorType.PLAYER_ORANGE, ColorType.PLAYER_GOLD,
			ColorType.PLAYER_YELLOW, ColorType.PLAYER_LIME, ColorType.PLAYER_GREEN,
			ColorType.PLAYER_TEAL, ColorType.PLAYER_AQUA, ColorType.PLAYER_BLUE,
			ColorType.PLAYER_PURPLE, ColorType.PLAYER_PINK, ColorType.PLAYER_BROWN,
			ColorType.PLAYER_WHITE, ColorType.PLAYER_GRAY, ColorType.PLAYER_BLACK,
		]],
	]);

	export function color(type : ColorType) : HexColor {
		return colorMap.get(type);
	}
	export function toString(type : ColorType) : string {
		if (!colorMap.has(type)) {
			console.error("Warning: color is not in color map", ColorType[type]);
			return "#FFFFFF";
		}
		return colorMap.get(type).toString();
	}
	export function toHex(type : ColorType) : number {
		if (!colorMap.has(type)) {
			console.error("Warning: color is not in color map", ColorType[type]);
			return 0xFFFFFF;
		}
		return colorMap.get(type).toHex();
	}
	export function hasEntityColor(type : EntityType) : boolean { return entityColorMap.has(type); }
	export function entityColors(type : EntityType) : Array<HexColor> {
		if (!entityColorMap.has(type)) {
			console.error("Warning: missing colors for", EntityType[type]);
			return [];
		}
		return entityColorMap.get(type).map((type : ColorType) => colorMap.get(type));
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