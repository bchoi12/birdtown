
import { EntityType } from 'game/entity/api'
import { BuffType, EquipTag } from 'game/factory/api'

import { SeededRandom } from 'util/seeded_random'

export type EquipList = {
	recommended: EntityType[];
	valid: EntityType[];
	invalid: EntityType[];
}

export namespace EquipFactory {

	const recommendedPairs = new Map<EntityType, EntityType[]>([
		[EntityType.BAZOOKA, [EntityType.JETPACK, EntityType.COWBOY_HAT, EntityType.SCOUTER]],
		[EntityType.GATLING, [EntityType.BOOSTER, EntityType.HEADPHONES]],
		[EntityType.LASER_GUN, [EntityType.SCOUTER, EntityType.POCKET_ROCKET]],
		[EntityType.MINIGUN, [EntityType.BLACK_HEADBAND, EntityType.PURPLE_HEADBAND]],
		[EntityType.ORB_CANNON, [EntityType.HEADPHONES, EntityType.JETPACK]],
		[EntityType.PISTOL, [EntityType.COWBOY_HAT, EntityType.SCOUTER]],
		[EntityType.PURPLE_GLOVE, [EntityType.PURPLE_HEADBAND]],
		[EntityType.RED_GLOVE, [EntityType.RED_HEADBAND]],
		[EntityType.RIFLE, [EntityType.BLACK_HEADBAND, EntityType.RED_HEADBAND, EntityType.SCOUTER]],
		[EntityType.SHOTGUN, [EntityType.COWBOY_HAT, EntityType.PURPLE_HEADBAND]],
		[EntityType.WING_CANNON, [EntityType.SCOUTER, EntityType.POCKET_ROCKET]],
	]);

	const specialPairs = new Map<EntityType, EntityType[]>([
		[EntityType.GOLDEN_GUN, [EntityType.TOP_HAT]],
	])

	const invalidPairs = new Map<EntityType, EntityType[]>([
		[EntityType.GATLING, [EntityType.SCOUTER]],
		[EntityType.MINIGUN, [EntityType.SCOUTER]],
		[EntityType.ORB_CANNON, [EntityType.SCOUTER]],
		[EntityType.PURPLE_GLOVE, [EntityType.SCOUTER]],
		[EntityType.RED_GLOVE, [EntityType.SCOUTER]],
		[EntityType.SHOTGUN, [EntityType.SCOUTER]],

		[EntityType.GOLDEN_GUN, [EntityType.SCOUTER]],
	]);

	let weapons = [...recommendedPairs.keys()];
	let equips = [
		EntityType.BLACK_HEADBAND, EntityType.BOOSTER, EntityType.COWBOY_HAT,
		EntityType.HEADPHONES, EntityType.JETPACK, EntityType.POCKET_ROCKET,
		EntityType.PURPLE_HEADBAND, EntityType.RED_HEADBAND, EntityType.SCOUTER,
		EntityType.TOP_HAT];
	let equipRandom = new SeededRandom(Math.floor(10000 * Math.random()));

	let nextIndex = -1;
	let shuffled = false;

	// [0, 1, 2, 3, ...]
	let indices = Array.from(Array(weapons.length).keys());

	export function seed(n : number) : void { equipRandom.seed(n); }
	export function weaponList() : EntityType[] { return [...recommendedPairs.keys()]; }
	export function specialWeapons() : EntityType[] { return [...specialPairs.keys()]; }
	export function invalidAlts(weaponType : EntityType) : EntityType[] { return invalidPairs.has(weaponType) ? invalidPairs.get(weaponType) : []; }
	export function equipList(type : EntityType) : EquipList {
		let seen = new Set();

		let valid = [];
		let recommended = [];
		if (recommendedPairs.has(type)) {
			recommended = recommendedPairs.get(type);
		} else if (specialPairs.has(type)) {
			recommended = specialPairs.get(type);
		}
		const invalid = invalidPairs.has(type) ? invalidPairs.get(type) : [];
		equips.forEach((equip : EntityType) => {
			if (recommended.includes(equip) || invalid.includes(equip)) {
				return;
			}

			valid.push(equip);
		});

		return {
			recommended: recommended,
			valid: valid,
			invalid: invalid,
		}
	}
	export function getAltEquip(type : EntityType) : EntityType {
		const allEquips = equipList(type);
		let numEquips = allEquips.recommended.length + allEquips.valid.length;

		let randomEquip = equipRandom.int(numEquips);

		if (randomEquip >= allEquips.recommended.length) {
			return allEquips.valid[randomEquip - allEquips.recommended.length];
		}
		return allEquips.recommended[randomEquip];
	}

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
		equipRandom.shuffle(indices, n);

		let randomPairs = [];
		for (let i = 0; i < n; ++i) {
			const weapon = weapons[indices[i]];
			randomPairs.push([weapon, getRecommendedAltEquip(weapon)]);
		}
		return randomPairs;
	}
	export function randomDefaultPair() : [EntityType, EntityType] {
		return getDefaultPair(randomIndex());
	}

	function randomIndex() : number {
		return equipRandom.int(weapons.length);
	}
	function getNextIndex() : number {
		if (nextIndex < 0) {
			equipRandom.shuffle(weapons);
			nextIndex = 0;
		} else {
			nextIndex++;
		}

		if (nextIndex >= weapons.length) {
			equipRandom.shuffle(weapons);
			nextIndex = 0;
		}
		return nextIndex;
	}
	function getRandomPair(type : EntityType) : [EntityType, EntityType] {
		return [type, getRecommendedAltEquip(type)];
	}
	function getDefaultPair(type : EntityType) : [EntityType, EntityType] {
		if (!recommendedPairs.has(type)) {
			console.error("Error: invalid equip %s", EntityType[type]);
			return [EntityType.UNKNOWN, EntityType.UNKNOWN];
		}
		return [type, recommendedPairs.get(type)[0]];
	}
	function getRecommendedAltEquip(type : EntityType, exclude? : Set<EntityType>) : EntityType {
		if (!recommendedPairs.has(type)) {
			console.error("Error: no equip pairings for %s", EntityType[type]);
			return EntityType.UNKNOWN;
		}

		let list = [];
		recommendedPairs.get(type).forEach((type : EntityType) => {
			if (!exclude || !exclude.has(type)) {
				list.push(type);
			}
		});
		if (list.length <= 0) {
			console.error("Error: excluded all recommended pairings for %s", EntityType[type], exclude);
			return EntityType.UNKNOWN;
		}

		return list[equipRandom.int(list.length)];
	}

	const starterWeapons = new Map<BuffType, EntityType[]>([
		[BuffType.ACROBATIC, [EntityType.BAZOOKA, EntityType.MINIGUN, EntityType.LASER_GUN, EntityType.PURPLE_GLOVE, EntityType.RED_GLOVE, EntityType.RIFLE, EntityType.SHOTGUN, EntityType.WING_CANNON]],
		[BuffType.BIG, [EntityType.BAZOOKA, EntityType.GATLING, EntityType.ORB_CANNON, EntityType.PISTOL, EntityType.PURPLE_GLOVE, EntityType.SHOTGUN, EntityType.WING_CANNON]],
		[BuffType.EAGLE_EYE, [EntityType.GATLING, EntityType.LASER_GUN, EntityType.MINIGUN, EntityType.ORB_CANNON, EntityType.PISTOL, EntityType.RED_GLOVE, EntityType.RIFLE]],
	]);
	export function getStarterPair(type : BuffType) : [EntityType, EntityType] {
		return getStarterPairN(type, 1)[0];
	}
	export function getStarterPairN(type : BuffType, n : number) : [EntityType, EntityType][] {
		if (!starterWeapons.has(type)) {
			console.error("Warning: missing starter weapons for %s", BuffType[type]);
			return randomN(n);
		}

		const weapons = starterWeapons.get(type);
		equipRandom.shuffle(weapons, n);

		let pairs = [];
		for (let i = 0; i < n; ++i) {
			const index = i % weapons.length;
			pairs.push([weapons[index], getRecommendedAltEquip(weapons[index])]);
		}
		return pairs;
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
		[EntityType.LASER_GUN, new Set([EquipTag.SIMPLE_SHOT, EquipTag.RAPID_FIRE])],
		[EntityType.WING_CANNON, new Set([EquipTag.BIG_DAMAGE, EquipTag.DISRUPTIVE])],

		[EntityType.GOLDEN_GUN, new Set([EquipTag.PRECISION_WEAPON, EquipTag.ONE_SHOT])],

		[EntityType.BLACK_HEADBAND, new Set([EquipTag.AIR_MOBILITY])],
		[EntityType.BOOSTER, new Set([EquipTag.AIR_MOBILITY])],
		[EntityType.COWBOY_HAT, new Set([EquipTag.ONE_SHOT, EquipTag.DODGY])],
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
			case EntityType.PISTOL:
				merged.add(EquipTag.ONE_SHOT);
				break;
			case EntityType.LASER_GUN:
				merged.add(EquipTag.BIG_BURST);
				merged.add(EquipTag.DISRUPTIVE);
				break;
			case EntityType.WING_CANNON:
				merged.add(EquipTag.LASER);
				break;
			}
		}

		return merged;
	}
	export function getEntityTags(type : EntityType) : Set<EquipTag> {
		if (!tags.has(type)) {
			return new Set();
		}
		return tags.get(type);
	}
}