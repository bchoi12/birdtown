
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
import { ColorFactory } from 'game/factory/color_factory'
import { LevelType } from 'game/system/api'

import { Strings } from 'strings'
import { ParamString, ParamType } from 'strings/param_string'


export namespace StringFactory {

	// Passed by reference
	const entityNames = new Map<EntityType, ParamString>([
		[EntityType.UNKNOWN, ParamString.of("unknown")],
		[EntityType.BAZOOKA, ParamString.of("bazooka").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.BAZOOKA).toString())],
		[EntityType.BOOSTER, ParamString.of("booster").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.BOOSTER).toString())],
		[EntityType.COWBOY_HAT, ParamString.of("yeehaw hat").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.COWBOY_HAT).toString())],
		[EntityType.GATLING, ParamString.of("gatling gun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.GATLING).toString())],
		[EntityType.HEADPHONES, ParamString.of("headphones").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.HEADPHONES).toString())],
		[EntityType.JETPACK, ParamString.of("jetpack").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.JETPACK).toString())],
		[EntityType.PISTOL, ParamString.of("pistol").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.PISTOL).toString())],
		[EntityType.POCKET_ROCKET, ParamString.of("pocket rocket").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.BAZOOKA).toString())],
		[EntityType.PURPLE_GLOVE, ParamString.of("star glove").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.PURPLE_GLOVE).toString())],	
		[EntityType.PURPLE_HEADBAND, ParamString.of("purple headband").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.PURPLE_HEADBAND).toString())],
		[EntityType.RED_GLOVE, ParamString.of("knife glove").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.RED_GLOVE).toString())],
		[EntityType.RED_HEADBAND, ParamString.of("red headband").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.RED_HEADBAND).toString())],
		[EntityType.SCOUTER, ParamString.of("scouter").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.SCOUTER).toString())],
		[EntityType.SHOTGUN, ParamString.of("shotgun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.SHOTGUN).toString())],
		[EntityType.SNIPER, ParamString.of("rifle").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.SNIPER).toString())],
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
		[EntityType.BOOSTER, ParamString.of("Boost yourself into the skies")],
		[EntityType.COWBOY_HAT, ParamString.of("Quickly roll and reload")],
		[EntityType.GATLING, ParamString.of("Hold to rev up a barrage of bullets")],
		[EntityType.HEADPHONES, ParamString.of("Manifests a dying star that collapses into a black hole")],
		[EntityType.JETPACK, ParamString.of("Lift yourself into the air")],
		[EntityType.PISTOL, ParamString.of("Fire 3 quick ones")],
		[EntityType.POCKET_ROCKET, ParamString.of("Launches a rocket out of nowhere")],
		[EntityType.PURPLE_HEADBAND, ParamString.of("Dash in the direction of your cursor")],
		[EntityType.PURPLE_GLOVE, ParamString.of("Toss 4 stars that explode after a short delay")],
		[EntityType.RED_HEADBAND, ParamString.of("Backflip opposite to your cursor and throw a sneaky knife")],
		[EntityType.RED_GLOVE, ParamString.of("Toss 2 deadly knives")],
		[EntityType.SCOUTER, ParamString.of("Hold to look ahead and charge your weapon")],
		[EntityType.SHOTGUN, ParamString.of("Sprays two quick recoiling blasts")],
		[EntityType.SNIPER, ParamString.of("Fire a short burst of high-energy bolts")],
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
		[LevelType.BIRDTOWN_CIRCLE, ParamString.of("Endless Birdtown")],
		[LevelType.DUELTOWN, ParamString.of("Dueltown")],
		[LevelType.LOBBY, ParamString.of("Lobby")],
		[LevelType.TINYTOWN, ParamString.of("Tinytown")],
	]);

	export function getLevelName(type : LevelType) : string {
		if (levelNames.has(type)) {
			return levelNames.get(type).toString();
		}
		return Strings.toTitleCase(LevelType[type]);
	}
}