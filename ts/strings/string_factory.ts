
import { ParamString, ParamType } from 'strings/param_string'
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
import { ColorFactory } from 'game/factory/color_factory'

export namespace StringFactory {

	// Passed by reference
	const entityNames = new Map<EntityType, ParamString>([
		[EntityType.UNKNOWN, ParamString.of("unknown")],
		[EntityType.BAZOOKA, ParamString.of("bazooka").set(ParamType.COLOR, ColorFactory.bazookaRed.toString())],
		[EntityType.CLAW, ParamString.of("claw")],
		[EntityType.COWBOY_HAT, ParamString.of("yeehaw hat")],
		[EntityType.GATLING, ParamString.of("gatling gun")],
		[EntityType.HEADBAND, ParamString.of("headband")],
		[EntityType.HEADPHONES, ParamString.of("headphones")],
		[EntityType.JETPACK, ParamString.of("jetpack")],
		[EntityType.PISTOL, ParamString.of("pistol")],
		[EntityType.SCOUTER, ParamString.of("scouter")],
		[EntityType.SHOTGUN, ParamString.of("shotgun")],
		[EntityType.SNIPER, ParamString.of("sniper")],
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
		[EntityType.BAZOOKA, ParamString.of("Fire an exploding rocket")],
		[EntityType.CLAW, ParamString.of("Toss 4 stars that explode after a short delay")],
		[EntityType.COWBOY_HAT, ParamString.of("Quickly roll and reload")],
		[EntityType.GATLING, ParamString.of("Hold to rev up a barrage of bullets")],
		[EntityType.HEADBAND, ParamString.of("Dash in the direction of your cursor")],
		[EntityType.HEADPHONES, ParamString.of("Manifests a dying star that collapses into a black hole")],
		[EntityType.JETPACK, ParamString.of("Lift yourself into the air")],
		[EntityType.PISTOL, ParamString.of("Fire a single bullet")],
		[EntityType.SCOUTER, ParamString.of("Hold to look ahead and charge your weapon")],
		[EntityType.SHOTGUN, ParamString.of("Blasts two quick recoiling spreads")],
		[EntityType.SNIPER, ParamString.of("Fire a short burst of high-energy bolts")],
	]);

	export function getEntityUsage(type : EntityType) : ParamString {
		if (entityUsage.has(type)) {
			return entityUsage.get(type);
		}
		return entityUsage.get(EntityType.UNKNOWN);
	}
}