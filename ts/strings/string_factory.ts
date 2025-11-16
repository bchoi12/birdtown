
import { game } from 'game'
import { GameMode } from 'game/api'
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
import { BuffType, EquipTag, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { LevelType, LevelLayout, LoadoutType } from 'game/system/api'

import { GameConfigMessage } from 'message/game_config_message'

import { Strings } from 'strings'
import { ParamString, ParamType } from 'strings/param_string'

import { KeyType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'

export namespace StringFactory {

	// Passed by reference
	const entityNames = new Map<EntityType, ParamString>([
		[EntityType.UNKNOWN, ParamString.of("unknown")],
		[EntityType.BAZOOKA, ParamString.of("bazooka").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.BAZOOKA).toString())],
		[EntityType.BLACK_HEADBAND, ParamString.of("black headband").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.BLACK_HEADBAND).toString())],
		[EntityType.BOOSTER, ParamString.of("booster").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.BOOSTER).toString())],
		[EntityType.COWBOY_HAT, ParamString.of("yeehaw hat").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.COWBOY_HAT).toString())],
		[EntityType.GATLING, ParamString.of("gatling gun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.GATLING).toString())],
		[EntityType.GOLDEN_GUN, ParamString.of("golden gun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.GOLDEN_GUN).toString())],
		[EntityType.HEADPHONES, ParamString.of("headphones").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.HEADPHONES).toString())],
		[EntityType.JETPACK, ParamString.of("jetpack").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.JETPACK).toString())],
		[EntityType.LASER_GUN, ParamString.of("laser gun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.LASER_GUN).toString())],
		[EntityType.MINIGUN, ParamString.of("minigun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.MINIGUN).toString())],
		[EntityType.ORB_CANNON, ParamString.of("orb blaster").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.ORB_CANNON).toString())],
		[EntityType.PISTOL, ParamString.of("pistol").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.PISTOL).toString())],
		[EntityType.POCKET_ROCKET, ParamString.of("pocket rocket").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.POCKET_ROCKET).toString())],
		[EntityType.PURPLE_GLOVE, ParamString.of("star glove").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.PURPLE_GLOVE).toString())],	
		[EntityType.PURPLE_HEADBAND, ParamString.of("purple headband").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.PURPLE_HEADBAND).toString())],
		[EntityType.RED_GLOVE, ParamString.of("knife glove").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.RED_GLOVE).toString())],
		[EntityType.RED_HEADBAND, ParamString.of("red headband").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.RED_HEADBAND).toString())],
		[EntityType.RIFLE, ParamString.of("rifle").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.RIFLE).toString())],
		[EntityType.SCOUTER, ParamString.of("scouter").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.SCOUTER).toString())],
		[EntityType.SHOTGUN, ParamString.of("shotgun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.SHOTGUN).toString())],
		[EntityType.TOP_HAT, ParamString.of("top hat").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.TOP_HAT).toString())],
		[EntityType.WING_CANNON, ParamString.of("wing cannon").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.WING_CANNON).toString())],
	]);

	export function getEntityName(entity : Entity) : ParamString {
		return this.getEntityTypeName(entity.type());
	}
	export function getEntityTypeName(type : EntityType) : ParamString {
		if (entityNames.has(type)) {
			return entityNames.get(type);
		}
		return ParamString.of(EntityType[type].toLowerCase());
	}

	const entityUsage = new Map<EntityType, ParamString>([
		[EntityType.UNKNOWN, ParamString.of("???")],
		[EntityType.BAZOOKA, ParamString.of("Launch an exploding rocket")],
		[EntityType.BLACK_HEADBAND, ParamString.of("Hold to float and slightly increase damage")],
		[EntityType.BOOSTER, ParamString.of("Boost yourself into the skies")],
		[EntityType.COWBOY_HAT, ParamString.of("Quickly roll and reload")],
		[EntityType.GATLING, ParamString.of("Hold to rev up a barrage of bullets")],
		[EntityType.GOLDEN_GUN, ParamString.of("One-shot your enemies")],
		[EntityType.HEADPHONES, ParamString.of("Hold to manifest dying star that collapses upon itself")],
		[EntityType.JETPACK, ParamString.of("Lift yourself into the air")],
		[EntityType.LASER_GUN, ParamString.of("Fire a short burst of high-energy bolts")],
		[EntityType.MINIGUN, ParamString.of("Fire a rapid burst with slight spread")],
		[EntityType.ORB_CANNON, ParamString.of("Hold to rev up a barrage of explosive orbs")],
		[EntityType.PISTOL, ParamString.of("Fire 3 quick ones")],
		[EntityType.POCKET_ROCKET, ParamString.of("Launches a mini rocket out of nowhere")],
		[EntityType.PURPLE_HEADBAND, ParamString.of("Dash in the direction of your cursor")],
		[EntityType.PURPLE_GLOVE, ParamString.of("Toss 4 stars that explode after a short delay")],
		[EntityType.RED_HEADBAND, ParamString.of("Backflip opposite to your cursor and throw a sneaky knife")],
		[EntityType.RED_GLOVE, ParamString.of("Toss 2 deadly knives")],
		[EntityType.RIFLE, ParamString.of("Fire a single long-range shot")],
		[EntityType.SCOUTER, ParamString.of("Hold to look ahead and charge your weapon")],
		[EntityType.SHOTGUN, ParamString.of("Sprays two quick recoiling blasts")],
		[EntityType.TOP_HAT, ParamString.of("Quickly tumble in any direction")],
		[EntityType.WING_CANNON, ParamString.of("Fire a barrage of exploding orbs")],
	]);

	export function hasEntityUsage(type : EntityType) : boolean {
		return entityUsage.has(type);
	}
	export function getEntityUsage(type : EntityType) : ParamString {
		if (hasEntityUsage(type)) {
			return entityUsage.get(type);
		}
		return entityUsage.get(EntityType.UNKNOWN);
	}

	const levelNames = new Map<LevelType, ParamString>([
		[LevelType.BIRDTOWN, ParamString.of("Birdtown")],
		[LevelType.CLIFF_LAKE, ParamString.of("Birdff")],
		[LevelType.RANDOM, ParamString.of("Random")],
	]);
	export function getLevelName(type : LevelType) : string {
		if (levelNames.has(type)) {
			return levelNames.get(type).toString();
		}
		return Strings.toTitleCase(LevelType[type]);
	}
	const layoutNames = new Map<LevelLayout, ParamString>([
		[LevelLayout.NORMAL, ParamString.of("None")],
		[LevelLayout.CIRCLE, ParamString.of("Endless (large)")],
		[LevelLayout.MIRROR, ParamString.of("Mirrored")],
		[LevelLayout.TINY, ParamString.of("Tiny")],
	]);
	export function getLayoutName(type : LevelLayout) : string {
		if (layoutNames.has(type)) {
			return layoutNames.get(type).toString();
		}
		return Strings.toTitleCase(LevelLayout[type]);
	}

	const modeNames = new Map<GameMode, string>([
		[GameMode.UNKNOWN, ""],
		[GameMode.FREE, "Free Play"],
		[GameMode.BUFF_BATTLE, "Buff Battle"],
		[GameMode.DUEL, "Duel"],
		[GameMode.FREE_FOR_ALL, "Deathmatch"],
		[GameMode.GOLDEN_GUN, "Golden Gun"],
		[GameMode.INVASION, "Invasion"],
		[GameMode.PRACTICE, "Practice Mode"],
		[GameMode.SPREE, "Spree"],
		[GameMode.SUDDEN_DEATH, "Lightning Round"],
		[GameMode.SURVIVAL, "Survival"],
		[GameMode.TEAM_BATTLE, "Team Battle"],
		[GameMode.TEAM_DEATHMATCH, "Team Deathmatch"],
		[GameMode.VIP, "Protect the VIP"],
	]);
	export function getModeName(type : GameMode) : string {
		if (modeNames.has(type)) {
			return modeNames.get(type).toString();
		}
		return Strings.toTitleCase(GameMode[type]);
	}
	export function getModeDescription(config : GameConfigMessage) : string {
		switch (config.type()) {			
		case GameMode.DUEL:
			return "Win the 1v1";
		case GameMode.FREE_FOR_ALL:
		case GameMode.GOLDEN_GUN:
			return `Be the first to score ${config.getPoints()} ${Strings.plural("point", config.getPoints())}`;
		case GameMode.INVASION:
			return `Defend Birdtown against the invasion`;
		case GameMode.PRACTICE:
			return game.isHost() ? `Press ${KeyNames.keyTypeHTML(KeyType.MENU)} to exit` : "Try out the game";
		case GameMode.BUFF_BATTLE:
		case GameMode.SUDDEN_DEATH:
		case GameMode.SURVIVAL:
			return "Be the last one standing";
		case GameMode.SPREE:
			return `Score ${config.getPoints()} ${Strings.plural("point", config.getPoints())} in a row`;
		case GameMode.TEAM_BATTLE:
			return "Eliminate the enemy team";
		case GameMode.TEAM_DEATHMATCH:
			return `Score ${config.getPoints()} before the other team`;
		case GameMode.VIP:
			return "Eliminate the other team's VIP";
		default:
			return "???";
		}
	}

	export function getLoadoutName(type : LoadoutType) : string {
		switch (type) {
		case LoadoutType.CHOOSE_TURNS:
		case LoadoutType.CHOOSE:
			return "Choose from 3";
		case LoadoutType.PICK_TURNS:
		case LoadoutType.PICK:
			return "Pick anything";
		case LoadoutType.RANDOM:
		case LoadoutType.RANDOM_ALL:
			return "Random"
		case LoadoutType.GOLDEN_GUN:
			return "Golden Gun";
		default:
			return "???";
		}
	}

	const tagNames = new Map<EquipTag, string>([
		[EquipTag.ASSASSINATE, "Assassination"],
		[EquipTag.HEAVY_HITTER, "Heavy Hitter"],
		[EquipTag.MELEE_RANGE, "Short Ranged"],
		[EquipTag.PRECISION_WEAPON, "Precision Weapon"],
		[EquipTag.SIMPLE_SHOT, "Simple Shooter"],
		[EquipTag.BIG_DAMAGE, "BIG Damage"],
		[EquipTag.BIG_RECOIL, "BIG Recoil"],
		[EquipTag.BIG_BURST, "BIG Burst"],
		[EquipTag.DISRUPTIVE, "Disruptive"],
		[EquipTag.RAPID_FIRE, "Rapid Fire"],
		[EquipTag.AIR_MOBILITY, "Air Superiority"],
		[EquipTag.HIGH_MOBILITY, "Go Fast"],
		[EquipTag.LONG_RANGE, "Long Range"],
		[EquipTag.DODGY, "Dodgy"],
		[EquipTag.NEEDS_REV, "Needs to Rev"],
		[EquipTag.BARRAGE, "BARRAGE"],
		[EquipTag.LASER, "LASER"],
		[EquipTag.MEGA_ROCKET, "BIG ROCKET"],
		[EquipTag.MASSIVE_DAMAGE, "MASSIVE DAMAGE"],
		[EquipTag.ONE_SHOT, "ONE SHOT"],
		[EquipTag.REALLY_DISRUPTIVE, "REALLY DISRUPTIVE"],
	]);
	export function getTagName(tag : EquipTag) : string {
		if (tagNames.has(tag)) {
			return tagNames.get(tag);
		}
		return Strings.toTitleCase(EquipTag[tag]);
	}

	const statNames = new Map<StatType, string>([
		[StatType.BURST_BONUS, "Bonus Ammo"],
		[StatType.BURST_BOOST, "Ammo Boost"],
		[StatType.BURST_BULLETS, "Ammo"],
		[StatType.BURSTS, "Shots"],
		[StatType.CHARGE_DELAY, "Charge Delay"],
		[StatType.CHARGE_RATE, "Charge Rate"],
		[StatType.CHARGED_BURSTS, "Charged Ammo"],
		[StatType.CHARGED_FIRE_TIME, "Charged Firing Time"],
		[StatType.CHARGED_PROJECTILE_ACCEL, "Charged Bullet Accel"],
		[StatType.CHARGED_PROJECTILE_SPEED, "Charged Bullet Speed"],
		[StatType.CHARGED_PROJECTILE_TTL, "Charged Bullet Lifetime"],
		[StatType.CHARGED_FORCE, "Charged Force"],
		[StatType.CHARGED_RELOAD_TIME, "Charged Reload Time"],
		[StatType.CRIT_CHANCE, "Crit Chance"],
		[StatType.CRIT_BOOST, "Crit Damage Boost"],
		[StatType.DAMAGE, "Damage"],
		[StatType.DAMAGE_BOOST, "Damage Boost"],
		[StatType.DAMAGE_CLOSE_BOOST, "Closeup Damage Boost"],
		[StatType.DAMAGE_FAR_BOOST, "Sharpshooter Damage Boost"],
		[StatType.DAMAGE_TAKEN_BOOST, "Damage Taken Boost"],
		[StatType.DAMAGE_RESIST_BOOST, "Damage Resist Boost"],
		[StatType.DOUBLE_JUMPS, "Double Jumps"],
		[StatType.EXPLOSION_BOOST, "Explosion Boost"],
		[StatType.EXPLOSION_DAMAGE, "Explosion Damage"],
		[StatType.EXPOSE_CHANCE, "Expose Chance"],
		[StatType.FIRE_BOOST, "Firing Boost"],
		[StatType.FIRE_TIME, "Firing Time"],
		[StatType.FORCE, "Force"],
		[StatType.FRICTION, "Friction"],
		[StatType.HEAL_PERCENT, "Healing Bullets"],
		[StatType.HEALTH, "Health"],
		[StatType.HORIZONTAL_ACCEL, "Horizontal Accel"],
		[StatType.HP_REGEN, "HP Regen"],
		[StatType.HP_REGEN_DELAY, "HP Regen Delay"],
		[StatType.SLOW_CHANCE, "Slow Chance"],
		[StatType.MAX_HORIZONTAL_SPEED, "Horizontal Speed"],
		[StatType.MAX_VERTICAL_SPEED, "Vertical Speed"],
		[StatType.MAX_WALKING_SPEED, "Walking Speed"],
		[StatType.PROJECTILE_ACCEL, "Bullet Accel"],
		[StatType.PROJECTILE_SPEED, "Bullet Speed"],
		[StatType.PROJECTILE_TTL, "Bullet Lifetime"],
		[StatType.RELOAD_BOOST, "Reload Boost"],
		[StatType.RELOAD_TIME, "Reload Time"],
		[StatType.REV_TIME, "Rev Time"],
		[StatType.REVIVE_BOOST, "Revive Boost"],
		[StatType.SCALING, "Size"],
		[StatType.SPEED_BOOST, "Speed Boost"],
		[StatType.SPEED_DEBUFF, "Slow"],
		[StatType.LIFE_STEAL, "Life Steal"],
		[StatType.SPEED, "Speed"],
		[StatType.SPREAD, "Spread"],
		[StatType.UNSTICK_DAMAGE, "Stick Damage"],
		[StatType.USE_BOOST, "Equip Boost"],
		[StatType.USE_JUICE, "Equip Energy"],
	]);

	export function getStatName(type : StatType) : string {
		if (statNames.has(type)) {
			return statNames.get(type);
		}
		return "Unknown Stat";
	}


	const buffNames = new Map<BuffType, string>([
		[BuffType.ACROBATIC, "FAST BIRD"],
		[BuffType.BIG, "BIG BIRD"],
		[BuffType.EAGLE_EYE, "SHARP BIRD"],

		[BuffType.BLASTER, "Booty Blaster"],
		[BuffType.COOL, "Really Cool Bird"],
		[BuffType.CRIT, "Gambling Addict"],
		[BuffType.DODGY, "Macho Grubba"],
		[BuffType.EXPLOSION, "Boomer"],
		[BuffType.GLASS_CANNON, "Glass Cannon"],
		[BuffType.HEALER, "Healer"],
		[BuffType.ICY, "Really Cold Bird"],
		[BuffType.JUICED, "Juicer"],
		[BuffType.JUMPER, "Jumper"],
		[BuffType.MOSQUITO, "Mosquito"],
		[BuffType.SPREE, "Spree"],
		[BuffType.SNIPER, "Eagle Eye"],
		[BuffType.STAT_STICK, "Stat Stick"],
		[BuffType.TANK, "TANK"],
		[BuffType.VAMPIRE, "Sucker"],
		[BuffType.WARMOGS, "Health Stacker"],
	]);

	export function hasBuffName(type : BuffType) : boolean {
		return buffNames.has(type);
	}
	export function getBuffName(type : BuffType) : string {
		if (hasBuffName(type)) {
			return buffNames.get(type);
		}
		return "Unknown Buff";
	}

	const buffUsage = new Map<BuffType, string>([
		[BuffType.ACROBATIC, "High mobility and critical strikes"],
		[BuffType.BIG, "Massive size and damage"],
		[BuffType.EAGLE_EYE, "Long range weapon expert"],

		[BuffType.BLASTER, "Massive damage when up close"],
		[BuffType.COOL, "Become cool - at level 3, ignore explosions"],
		[BuffType.CRIT, "Increase critical strike chance and critical damage"],
		[BuffType.DODGY, "Use your equip more - at level 3, dodge projectiles while flipping"],
		[BuffType.EXPLOSION, "Increase explosion size and damage"],
		[BuffType.GLASS_CANNON, "Massively increase damage dealt and taken"],
		[BuffType.HEALER, "Heal your teammates with your bullets"],
		[BuffType.ICY, "Fire faster and slow down enemies"],
		[BuffType.JUICED, "Increases critical effects - at level 3, your scouter is always charged"],
		[BuffType.JUMPER, "Increases damage resistance and exponentially adds more double jumps"],
		[BuffType.MOSQUITO, "Become annoying"],
		[BuffType.SNIPER, "Massive damage when far away"],
		[BuffType.STAT_STICK, "Increases stats randomly"],
		[BuffType.TANK, "Become big and tanky, deal bonus damage based on your bonus health"],
		[BuffType.VAMPIRE, "Increase damage dealt, life steal, and damage taken"],
		[BuffType.WARMOGS, "Increases health by a flat amount and percentage"],
	]);
	export function getBuffDescription(type : BuffType) : string {
		if (buffUsage.has(type)) {
			return buffUsage.get(type);
		}

		return `Error: missing ${getBuffName(type)} description`;
	}
}