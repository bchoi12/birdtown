
import { ParamString, ParamType } from 'strings/param_string'
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
import { ColorFactory } from 'game/factory/color_factory'

export namespace StringFactory {

	// Passed by reference
	const entityNames = new Map<EntityType, ParamString>([
		[EntityType.UNKNOWN, ParamString.of("unknown")],
		[EntityType.BAZOOKA, ParamString.of("bazooka").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.BAZOOKA).toString())],
		[EntityType.BOOSTER, ParamString.of("booster").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.BOOSTER).toString())],
		[EntityType.CLAW, ParamString.of("claw").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.CLAW).toString())],
		[EntityType.COWBOY_HAT, ParamString.of("yeehaw hat").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.COWBOY_HAT).toString())],
		[EntityType.GATLING, ParamString.of("gatling gun").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.GATLING).toString())],
		[EntityType.HEADBAND, ParamString.of("headband").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.HEADBAND).toString())],
		[EntityType.HEADPHONES, ParamString.of("headphones").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.HEADPHONES).toString())],
		[EntityType.JETPACK, ParamString.of("jetpack").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.JETPACK).toString())],
		[EntityType.PISTOL, ParamString.of("pistol").set(ParamType.COLOR, ColorFactory.entityColor(EntityType.PISTOL).toString())],
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
		[EntityType.CLAW, ParamString.of("Toss 4 stars that explode after a short delay")],
		[EntityType.COWBOY_HAT, ParamString.of("Quickly roll and reload")],
		[EntityType.GATLING, ParamString.of("Hold to rev up a barrage of bullets")],
		[EntityType.HEADBAND, ParamString.of("Dash in the direction of your cursor")],
		[EntityType.HEADPHONES, ParamString.of("Manifests a dying star that collapses into a black hole")],
		[EntityType.JETPACK, ParamString.of("Lift yourself into the air")],
		[EntityType.PISTOL, ParamString.of("Fire 3 quick ones")],
		[EntityType.SCOUTER, ParamString.of("Hold to look ahead and charge your weapon")],
		[EntityType.SHOTGUN, ParamString.of("Sprays two quick recoiling blasts")],
		[EntityType.SNIPER, ParamString.of("Fire a short burst of high-energy bolts")],
		[EntityType.WING_CANNON, ParamString.of("Fire a barrage of exploding orbs")],
	]);

	export function getEntityUsage(type : EntityType) : ParamString {
		if (entityUsage.has(type)) {
			return entityUsage.get(type);
		}
		return entityUsage.get(EntityType.UNKNOWN);
	}
}