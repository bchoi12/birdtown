
import { game } from 'game'
import { GameMode } from 'game/api'
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
import { EquipTag } from 'game/factory/api'
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
		[EntityType.SNIPER, ParamString.of("laser gun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.SNIPER).toString())],
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
		[EntityType.BLACK_HEADBAND, ParamString.of("Jump in the air and hold to float")],
		[EntityType.BOOSTER, ParamString.of("Boost yourself into the skies")],
		[EntityType.COWBOY_HAT, ParamString.of("Quickly roll and reload")],
		[EntityType.GATLING, ParamString.of("Hold to rev up a barrage of bullets")],
		[EntityType.GOLDEN_GUN, ParamString.of("One-shot your enemies")],
		[EntityType.HEADPHONES, ParamString.of("Manifests a dying star that collapses into a black hole")],
		[EntityType.JETPACK, ParamString.of("Lift yourself into the air")],
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
		[EntityType.SNIPER, ParamString.of("Fire a short burst of high-energy bolts")],
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
		[LevelType.CLIFF_LAKE, ParamString.of("Cliff Lake")],
		[LevelType.RANDOM, ParamString.of("Random")],
	]);
	export function getLevelName(type : LevelType) : string {
		if (levelNames.has(type)) {
			return levelNames.get(type).toString();
		}
		return Strings.toTitleCase(LevelType[type]);
	}
	const layoutNames = new Map<LevelLayout, ParamString>([
		[LevelLayout.NORMAL, ParamString.of("Normal")],
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
		[GameMode.DUEL, "Duel"],
		[GameMode.FREE_FOR_ALL, "Deathmatch"],
		[GameMode.GOLDEN_GUN, "Golden Gun"],
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
		case GameMode.PRACTICE:
			return game.isHost() ? `Press ${KeyNames.keyTypeHTML(KeyType.MENU)} to exit` : "Try out the game";
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
}