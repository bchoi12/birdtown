
import { StringType } from 'strings/api'
import { ParamString, ParamType } from 'strings/param_string'
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
import { ColorFactory } from 'game/factory/color_factory'

export namespace StringFactory {

	// Passed by reference
	const strings = new Map<StringType, ParamString>([
		[StringType.UNKNOWN, ParamString.base("unknown")],
		[StringType.ENTITY_BAZOOKA, ParamString.base("bazooka").set(ParamType.COLOR, ColorFactory.bazookaRed.toString())],
		[StringType.ENTITY_JETPACK, ParamString.base("jetpack")],
		[StringType.ENTITY_SCOUTER, ParamString.base("scouter")],
		[StringType.ENTITY_SNIPER, ParamString.base("sniper")],
	]);

	const entityNames = new Map<EntityType, StringType>([
		[EntityType.UNKNOWN, StringType.ENTITY_UNKNOWN],
		[EntityType.BAZOOKA, StringType.ENTITY_BAZOOKA],
		[EntityType.JETPACK, StringType.ENTITY_JETPACK],
		[EntityType.SCOUTER, StringType.ENTITY_SCOUTER],
		[EntityType.SNIPER, StringType.ENTITY_SNIPER],
	]);

	export function getEntityName(entity : Entity) : ParamString {
		return this.getEntityTypeName(entity.type());
	}
	export function getEntityTypeName(type : EntityType) : ParamString {
		if (entityNames.has(type)) {
			return resolveString(entityNames.get(type));
		}
		return ParamString.base(EntityType[type].toLowerCase());
	}

	function resolveString(type : StringType) : ParamString {
		if (!strings.has(type)) {
			console.error("Error: missing entry for type ", StringType[type]);
			return null;
		}
		return strings.get(type)
	}

}