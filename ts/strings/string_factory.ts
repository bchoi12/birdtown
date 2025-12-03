
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
		[EntityType.LASER_CANNON, ParamString.of("laser cannon").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.LASER_CANNON).toString())],
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
		[EntityType.LASER_CANNON, ParamString.of("Rev a double shot of explosive high-energy bolts")],
		[EntityType.LASER_GUN, ParamString.of("Fire a short burst of high-energy bolts")],
		[EntityType.MINIGUN, ParamString.of("Fire a rapid burst with slight spread")],
		[EntityType.ORB_CANNON, ParamString.of("Hold to rev up a barrage of explosive orbs")],
		[EntityType.PISTOL, ParamString.of("Fire 3 quick ones")],
		[EntityType.POCKET_ROCKET, ParamString.of("Launches a mini rocket out of nowhere")],
		[EntityType.PURPLE_HEADBAND, ParamString.of("Dash in the direction of your cursor")],
		[EntityType.PURPLE_GLOVE, ParamString.of("Toss 4 stars that explode after a short delay")],
		[EntityType.RED_HEADBAND, ParamString.of("Backflip opposite to your cursor and throw a poisoned knife")],
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
		[EquipTag.DOUBLE_LASER, "DOUBLE LASER"],
		[EquipTag.LASER, "LASER"],
		[EquipTag.MEGA_ROCKET, "BIG ROCKET"],
		[EquipTag.MASSIVE_DAMAGE, "MASSIVE DAMAGE"],
		[EquipTag.ONE_SHOT, "ONE SHOT"],
		[EquipTag.PIERCING, "PIERCING"],
		[EquipTag.REALLY_DISRUPTIVE, "REALLY DISRUPTIVE"],
	]);
	export function getTagName(tag : EquipTag) : string {
		if (tagNames.has(tag)) {
			return tagNames.get(tag);
		}
		return Strings.toTitleCase(EquipTag[tag]);
	}

	const statNames = new Map<StatType, string>([
		[StatType.AIR_SPEED_BOOST, "Ramping Air Speed"],
		[StatType.BURST_BONUS, "Bonus Ammo"],
		[StatType.BURST_BOOST, "Ammo"],
		[StatType.BURST_BULLETS, "Bullets"],
		[StatType.BURSTS, "Ammo"],
		[StatType.CHARGE_BOOST, "Charge Speed"],
		[StatType.CHARGE_DELAY, "Charge Delay"],
		[StatType.CHARGE_RATE, "Charge Rate"],
		[StatType.CHARGED_BURSTS, "Charged Ammo"],
		[StatType.CHARGED_FIRE_TIME, "Charged Firing Time"],
		[StatType.CHARGED_PROJECTILE_ACCEL, "Charged Bullet Accel"],
		[StatType.CHARGED_PROJECTILE_SPEED, "Charged Bullet Speed"],
		[StatType.CHARGED_PROJECTILE_TTL, "Charged Bullet Lifetime"],
		[StatType.CHARGED_FORCE, "Charged Force"],
		[StatType.CHARGED_RELOAD_TIME, "Charged Reload Time"],
		[StatType.CHARGED_REV_TIME, "Charged Rev Time"],
		[StatType.CRIT_CHANCE, "Crit Chance"],
		[StatType.CRIT_BOOST, "Crit Damage"],
		[StatType.DAMAGE, "Damage"],
		[StatType.DAMAGE_BOOST, "Damage"],
		[StatType.DAMAGE_CLOSE_BOOST, "Closeup Damage"],
		[StatType.DAMAGE_FAR_BOOST, "Faraway Damage"],
		[StatType.DAMAGE_TAKEN_BOOST, "Damage Taken"],
		[StatType.DAMAGE_RESIST_BOOST, "Damage Resist"],
		[StatType.DOUBLE_JUMPS, "Double Jumps"],
		[StatType.EXPLOSION_BOOST, "Explosion Size"],
		[StatType.EXPLOSION_DAMAGE, "Explosion Damage"],
		[StatType.EXPOSE_PERCENT, "Damage Ramp"],
		[StatType.FIRE_BOOST, "Firing Speed"],
		[StatType.FIRE_TIME, "Firing Time"],
		[StatType.FLAME_CHANCE, "Flame Chance"],
		[StatType.FORCE, "Force"],
		[StatType.FRICTION, "Friction"],
		[StatType.HEAL_PERCENT, "Healing Bullets"],
		[StatType.HEALTH, "Health"],
		[StatType.HEALTH_ADDITION, "On-hit Health"],
		[StatType.HEALTH_BOOST, "Health"],
		[StatType.HORIZONTAL_ACCEL, "Horizontal Accel"],
		[StatType.HP_REGEN, "HP Regeneration"],
		[StatType.HP_REGEN_DELAY, "HP Regen Delay"],
		[StatType.IMBUE_LEVEL, "Inspiration Level"],
		[StatType.LIFE_STEAL, "Life Steal"],
		[StatType.MAX_HORIZONTAL_SPEED, "Horizontal Speed"],
		[StatType.MAX_VERTICAL_SPEED, "Vertical Speed"],
		[StatType.MAX_WALKING_SPEED, "Walking Speed"],
		[StatType.POISON_CHANCE, "Poison Chance"],
		[StatType.PROJECTILE_ACCEL, "Bullet Accel"],
		[StatType.PROJECTILE_SCALING_BOOST, "Projectile Size"],
		[StatType.PROJECTILE_SPEED, "Bullet Speed"],
		[StatType.PROJECTILE_TTL, "Bullet Lifetime"],
		[StatType.RELOAD_BOOST, "Reload Speed"],
		[StatType.RELOAD_TIME, "Reload Time"],
		[StatType.REV_BOOST, "Rev Speed"],
		[StatType.REV_TIME, "Rev Time"],
		[StatType.REVIVE_BOOST, "Revive Speed"],
		[StatType.SCALING, "Size"],
		[StatType.SHIELD, "Shield"],
		[StatType.SHIELD_STEAL, "Shield Steal"],
		[StatType.SPEED_BOOST, "Speed"],
		[StatType.SPEED_DEBUFF, "Slow"],
		[StatType.SLOW_CHANCE, "Slow Chance"],
		[StatType.SPEED, "Speed"],
		[StatType.SPREAD, "Spread"],
		[StatType.UNSTICK_DAMAGE, "Stick Damage"],
		[StatType.USE_BOOST, "Equip Proficiency"],
		[StatType.USE_JUICE, "Equip Use Juice"],
	]);



	const toSign = (value : number) => value > 0 ? '+' : '';

	type StatFn = (name : string, value : number) => string;
	const toBoost : StatFn = (name : string, value : number) => `${toSign(value)}${Math.round(100 * value)}% ${name}`;
	const toPercent : StatFn = (name : string, value : number) => `${Math.round(100 * value)}% ${name}`;
	const toMult : StatFn = (name : string, value : number) => `${Math.round(10 * (1 + value))/10}x ${name}`;
	const toInt : StatFn = (name : string, value : number) => `${toSign(value)}${Math.round(value)} ${name}`;
	const toNum : StatFn = (name : string, value : number) => `${toSign(value)}${Math.round(10 * value)/10} ${name}`;
	const toRate : StatFn = (name : string, value : number) => `${toSign(value)}${Math.round(value)}% ${name}`;
	const toTime : StatFn = (name : string, value : number) => `${value > 1000 ? Math.round(value / 1000) : value}${value > 1000 ? 's' : 'ms'} ${name}`;

	const statFns = new Map<StatType, StatFn>([
		[StatType.AIR_SPEED_BOOST, toBoost],
		[StatType.BURST_BONUS, toInt],
		[StatType.BURST_BOOST, toMult],
		[StatType.BURST_BULLETS, toInt],
		[StatType.BURSTS, toInt],
		[StatType.CHARGE_BOOST, toMult],
		[StatType.CHARGE_DELAY, toInt],
		[StatType.CHARGE_RATE, toRate],
		[StatType.CHARGED_BURSTS, toInt],
		[StatType.CHARGED_FIRE_TIME, toTime],
		[StatType.CHARGED_PROJECTILE_ACCEL, toNum],
		[StatType.CHARGED_PROJECTILE_SPEED, toNum],
		[StatType.CHARGED_PROJECTILE_TTL, toTime],
		[StatType.CHARGED_FORCE, toNum],
		[StatType.CHARGED_RELOAD_TIME, toTime],
		[StatType.CHARGED_REV_TIME, toTime],
		[StatType.CRIT_CHANCE, toPercent],
		[StatType.CRIT_BOOST, toMult],
		[StatType.DAMAGE, toInt],
		[StatType.DAMAGE_BOOST, toMult],
		[StatType.DAMAGE_CLOSE_BOOST, toMult],
		[StatType.DAMAGE_FAR_BOOST, toMult],
		[StatType.DAMAGE_TAKEN_BOOST, toBoost],
		[StatType.DAMAGE_RESIST_BOOST, toBoost],
		[StatType.DOUBLE_JUMPS, toInt],
		[StatType.EXPLOSION_BOOST, toMult],
		[StatType.EXPLOSION_DAMAGE, toMult],
		[StatType.EXPOSE_PERCENT, toPercent],
		[StatType.FIRE_BOOST, toMult],
		[StatType.FIRE_TIME, toTime],
		[StatType.FLAME_CHANCE, toPercent],
		[StatType.FORCE, toNum],
		[StatType.FRICTION, toNum],
		[StatType.HEAL_PERCENT, toPercent],
		[StatType.HEALTH, toInt],
		[StatType.HEALTH_ADDITION, toInt],
		[StatType.HEALTH_BOOST, toMult],
		[StatType.HORIZONTAL_ACCEL, toNum],
		[StatType.HP_REGEN, toPercent],
		[StatType.HP_REGEN_DELAY, toTime],
		[StatType.IMBUE_LEVEL, toInt],
		[StatType.LIFE_STEAL, toPercent],
		[StatType.MAX_HORIZONTAL_SPEED, toNum],
		[StatType.MAX_VERTICAL_SPEED, toNum],
		[StatType.MAX_WALKING_SPEED, toNum],
		[StatType.POISON_CHANCE, toPercent],
		[StatType.PROJECTILE_ACCEL, toNum],
		[StatType.PROJECTILE_SCALING_BOOST, toMult],
		[StatType.PROJECTILE_SPEED, toNum],
		[StatType.PROJECTILE_TTL, toTime],
		[StatType.RELOAD_BOOST, toMult],
		[StatType.RELOAD_TIME, toTime],
		[StatType.REV_BOOST, toMult],
		[StatType.REV_TIME, toTime],
		[StatType.REVIVE_BOOST, toMult],
		[StatType.SCALING, toMult],
		[StatType.SHIELD, toInt],
		[StatType.SHIELD_STEAL, toPercent],
		[StatType.SPEED_BOOST, toMult],
		[StatType.SPEED_DEBUFF, toMult],
		[StatType.SLOW_CHANCE, toPercent],
		[StatType.SPEED, toNum],
		[StatType.SPREAD, toInt],
		[StatType.UNSTICK_DAMAGE, toInt],
		[StatType.USE_BOOST, toBoost],
		[StatType.USE_JUICE, toInt],
	]);

	export function getStatName(type : StatType) : string {
		if (statNames.has(type)) {
			return statNames.get(type);
		}
		return StatType[type];
	}

	export function getStat(type : StatType, value : number) : string {
		const name = getStatName(type);

		if (statFns.has(type)) {
			return statFns.get(type)(name, value);
		}
		return `${value} ${name}`;
	}

	const buffNames = new Map<BuffType, string>([
		[BuffType.ASSASSIN, "ASSASSIN BIRD"],
		[BuffType.BIG, "BIG BIRD"],
		[BuffType.CARRY, "CARRY BIRD"],

		[BuffType.BLASTER, "Booty Blaster"],
		[BuffType.BRUISER, "Atmogs"],
		[BuffType.COOL, "Really Cool Birb"],
		[BuffType.SLY, "Sly Dog"],
		[BuffType.DODGY, "Macho Grubba"],
		[BuffType.EXPLOSION, "Boomer"],
		[BuffType.FIERY, "Rotisserie"],
		[BuffType.GLASS_CANNON, "Tons of Damage"],
		[BuffType.HEALER, "Inspiration"],
		[BuffType.ICY, "Really Cold Brrd"],
		[BuffType.JUICED, "Juicer"],
		[BuffType.JUMPER, "Zeppelin"],
		[BuffType.MOSQUITO, "Skeeter"],
		[BuffType.SPREE, "Spree"],
		[BuffType.SNIPER, "Hawkeye"],
		[BuffType.STAT_STICK, "Stat Stick"],
		[BuffType.SUN, "Photosynthesis"],
		[BuffType.SQUAWK_SHIELD, "Squawk Shield"],
		[BuffType.SQUAWK_SHOT, "Verbal Alchemy"],
		[BuffType.TANK, "BORB"],
		[BuffType.NIGHT, "Keyboard Warrior"],
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
		[BuffType.ASSASSIN, "Increase your mobility, critical strikes, and skill charge each round"],
		[BuffType.BIG, "Increase your size, damage, and shielding each round"],
		[BuffType.CARRY, "Increase your weapon mastery, life steal, and ramping damage each round"],

		[BuffType.BLASTER, "Massive damage when up close"],
		[BuffType.BRUISER, "Increase your health and shielding, gain damage based on health"],
		[BuffType.COOL, "Gain speed, faster reloads and cooler crits - at level 3, ignore explosions"],
		[BuffType.SLY, "Increases critical effects and poison chance (% missing health damage)"],
		[BuffType.DODGY, "Use your skills more - at level 3, dodge projectiles while flipping"],
		[BuffType.EXPLOSION, "Increase explosion size and damage"],
		[BuffType.FIERY, "Fire faster and set your opponents on fire (% max health damage)"],
		[BuffType.GLASS_CANNON, "Increase damage and life steal at the cost of your health"],
		[BuffType.HEALER, "Heal and inspire your teammates with your bullets"],
		[BuffType.ICY, "Shoot giant bullets that slow down your enemies"],
		[BuffType.JUICED, "Slightly increases weapon mastery - at level 3, your weapon is always charged"],
		[BuffType.JUMPER, "Increase number of jumps and gain speed after each jump"],
		[BuffType.MOSQUITO, "Become annoying - fire a barrage at the cost of your damage"],
		[BuffType.SQUAWK_SHIELD, "Squawk to deflect nearby projectiles, gain a bit of shielding"],
		[BuffType.SQUAWK_SHOT, "Squawk to fire a projectile, gain a bit of damage"],
		[BuffType.SUN, "Permanently gain health and grow larger whenever the sun is out"],
		[BuffType.TANK, "Massively increase your size, tankiness, and % health"],
		[BuffType.NIGHT, "Provides a massive shield, damage, and life steal...but only at night"],

		[BuffType.STAT_STICK, "Increases stats randomly"],

		[BuffType.SNIPER, "Massive damage when far away"],
		[BuffType.WARMOGS, "Increases health by a flat amount and percentage"],
	]);
	export function getBuffDescription(type : BuffType) : string {
		if (buffUsage.has(type)) {
			return buffUsage.get(type);
		}

		return `Error: missing ${getBuffName(type)} description`;
	}
}