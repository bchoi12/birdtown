
import { EntityType } from 'game/entity/api'
import { EquipTag } from 'game/factory/api'

import { globalRandom } from 'util/seeded_random'

// TODO: this should be factory (EquipFactory)
export namespace EquipPairs {

	const pairs = new Map<EntityType, EntityType[]>([
		[EntityType.BAZOOKA, [EntityType.JETPACK, EntityType.COWBOY_HAT, EntityType.SCOUTER]],
		[EntityType.GATLING, [EntityType.BOOSTER, EntityType.HEADPHONES]],
		[EntityType.MINIGUN, [EntityType.BLACK_HEADBAND, EntityType.PURPLE_HEADBAND]],
		[EntityType.ORB_CANNON, [EntityType.HEADPHONES, EntityType.JETPACK]],
		[EntityType.PISTOL, [EntityType.COWBOY_HAT, EntityType.SCOUTER]],
		[EntityType.PURPLE_GLOVE, [EntityType.PURPLE_HEADBAND]],
		[EntityType.RED_GLOVE, [EntityType.RED_HEADBAND]],
		[EntityType.RIFLE, [EntityType.BLACK_HEADBAND, EntityType.RED_HEADBAND]],
		[EntityType.SHOTGUN, [EntityType.COWBOY_HAT, EntityType.PURPLE_HEADBAND]],
		[EntityType.SNIPER, [EntityType.SCOUTER, EntityType.POCKET_ROCKET]],
		[EntityType.WING_CANNON, [EntityType.SCOUTER, EntityType.POCKET_ROCKET]],
	]);

	let weapons = [...pairs.keys()];
	let nextIndex = -1;
	let shuffled = false;

	// [0, 1, 2, 3, ...]
	let indices = Array.from(Array(weapons.length).keys());

	export function next() : [EntityType, EntityType] {
		const weapon = weapons[getNextIndex()];
		return getRandomPair(weapon);
	}
	export function nextDefaultPair() : [EntityType, EntityType] {
		const weapon = weapons[getNextIndex()];
		return getDefaultPair(weapon);
	}
	export function random() : [EntityType, EntityType] {
		return randomN(1)[0];
	}
	export function randomN(n : number) : [EntityType, EntityType][] {
		globalRandom.shuffle(indices, n);

		let randomPairs = [];
		for (let i = 0; i < n; ++i) {
			const weapon = weapons[indices[i]];
			randomPairs.push([weapon, getAltEquip(weapon)]);
		}
		return randomPairs;
	}
	export function randomDefaultPair() : [EntityType, EntityType] {
		return getDefaultPair(randomIndex());
	}

	function randomIndex() : number {
		return globalRandom.int(weapons.length);
	}
	function getNextIndex() : number {
		if (nextIndex < 0) {
			globalRandom.shuffle(weapons);
			nextIndex = 0;
		} else {
			nextIndex++;
		}

		if (nextIndex >= weapons.length) {
			globalRandom.shuffle(weapons);
			nextIndex = 0;
		}
		return nextIndex;
	}
	function getRandomPair(type : EntityType) : [EntityType, EntityType] {
		return [type, getAltEquip(type)];
	}
	function getDefaultPair(type : EntityType) : [EntityType, EntityType] {
		if (!pairs.has(type)) {
			console.error("Error: invalid equip %s", EntityType[type]);
			return [EntityType.UNKNOWN, EntityType.UNKNOWN];
		}
		return [type, pairs.get(type)[0]];
	}
	function getAltEquip(type : EntityType) : EntityType {
		if (!pairs.has(type)) {
			console.error("Error: no equip pairings for %s", EntityType[type]);
			return EntityType.UNKNOWN;
		}

		const list = pairs.get(type);
		return list[globalRandom.int(list.length)];
	}

	const tags = new Map<EntityType, Set<EquipTag>>([
		[EntityType.BAZOOKA, new Set([EquipTag.HEAVY_HITTER, EquipTag.BIG_RECOIL, EquipTag.DISRUPTIVE])],
		[EntityType.GATLING, new Set([EquipTag.HEAVY_HITTER, EquipTag.BIG_DAMAGE, EquipTag.NEEDS_REV])],
		[EntityType.MINIGUN, new Set([EquipTag.SIMPLE_SHOT, EquipTag.RAPID_FIRE])],
		[EntityType.ORB_CANNON, new Set([EquipTag.HEAVY_HITTER, EquipTag.DISRUPTIVE, EquipTag.NEEDS_REV])],
		[EntityType.PISTOL, new Set([EquipTag.PRECISION_WEAPON])],
		[EntityType.PURPLE_GLOVE, new Set([EquipTag.ASSASSINATE, EquipTag.ONE_SHOT])],
		[EntityType.RED_GLOVE, new Set([EquipTag.ASSASSINATE, EquipTag.RAPID_FIRE])],
		[EntityType.RIFLE, new Set([EquipTag.PRECISION_WEAPON, EquipTag.LONG_RANGE])],
		[EntityType.SHOTGUN, new Set([EquipTag.MELEE_RANGE, EquipTag.BIG_BURST, EquipTag.BIG_RECOIL])],
		[EntityType.SNIPER, new Set([EquipTag.SIMPLE_SHOT, EquipTag.RAPID_FIRE])],
		[EntityType.WING_CANNON, new Set([EquipTag.BIG_DAMAGE, EquipTag.DISRUPTIVE])],

		[EntityType.GOLDEN_GUN, new Set([EquipTag.PRECISION_WEAPON, EquipTag.BIG_BURST])],

		[EntityType.BLACK_HEADBAND, new Set([EquipTag.AIR_MOBILITY])],
		[EntityType.BOOSTER, new Set([EquipTag.AIR_MOBILITY])],
		[EntityType.COWBOY_HAT, new Set([EquipTag.BIG_BURST, EquipTag.DODGY])],
		[EntityType.HEADPHONES, new Set([EquipTag.DISRUPTIVE])],
		[EntityType.JETPACK, new Set([EquipTag.AIR_MOBILITY])],
		[EntityType.POCKET_ROCKET, new Set([EquipTag.DISRUPTIVE, EquipTag.BIG_DAMAGE])],
		[EntityType.PURPLE_HEADBAND, new Set([EquipTag.HIGH_MOBILITY])],
		[EntityType.RED_HEADBAND, new Set([EquipTag.HIGH_MOBILITY, EquipTag.RAPID_FIRE])],
		[EntityType.SCOUTER, new Set([EquipTag.LONG_RANGE])],
		[EntityType.TOP_HAT, new Set([EquipTag.DODGY, EquipTag.RAPID_FIRE])],
	]);
	export function getTags(pair : [EntityType, EntityType]) : Set<EquipTag> {
		const firstTags = getEntityTags(pair[0]);
		const secondTags = getEntityTags(pair[1]);

		let merged = new Set<EquipTag>([...firstTags, ...secondTags]);

		if (firstTags.has(EquipTag.BIG_DAMAGE) && secondTags.has(EquipTag.BIG_DAMAGE)) {
			merged.delete(EquipTag.BIG_DAMAGE);
			merged.add(EquipTag.MASSIVE_DAMAGE);
		}

		if (firstTags.has(EquipTag.RAPID_FIRE) && secondTags.has(EquipTag.RAPID_FIRE)) {
			merged.delete(EquipTag.RAPID_FIRE);
			merged.add(EquipTag.BARRAGE);
		}

		if (firstTags.has(EquipTag.DISRUPTIVE) && secondTags.has(EquipTag.DISRUPTIVE)) {
			merged.delete(EquipTag.DISRUPTIVE);
			merged.add(EquipTag.REALLY_DISRUPTIVE);
		}

		if (firstTags.has(EquipTag.BIG_BURST) && secondTags.has(EquipTag.BIG_BURST) || merged.has(EquipTag.ONE_SHOT)) {
			merged.delete(EquipTag.BIG_BURST);
			merged.add(EquipTag.ONE_SHOT);
		}


		if (pair[1] === EntityType.SCOUTER) {
			switch (pair[0]) {
			case EntityType.BAZOOKA:
				merged.add(EquipTag.MEGA_ROCKET);
				merged.add(EquipTag.ONE_SHOT);
				break;
			case EntityType.SNIPER:
				merged.add(EquipTag.ONE_SHOT);
				break;
			case EntityType.SNIPER:
				merged.add(EquipTag.DISRUPTIVE);
				break;
			case EntityType.WING_CANNON:
				merged.add(EquipTag.LASER);
				break;
			}
		}

		return merged;
	}
	function getEntityTags(type : EntityType) : Set<EquipTag> {
		if (!tags.has(type)) {
			return new Set();
		}
		return tags.get(type);
	}
}