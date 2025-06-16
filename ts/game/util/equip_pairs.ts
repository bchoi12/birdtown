
import { EntityType } from 'game/entity/api'

import { globalRandom } from 'util/seeded_random'

export namespace EquipPairs {

	const pairs = new Map<EntityType, EntityType[]>([
		[EntityType.BAZOOKA, [EntityType.JETPACK, EntityType.COWBOY_HAT, EntityType.SCOUTER]],
		[EntityType.GATLING, [EntityType.BOOSTER, EntityType.HEADPHONES]],
		[EntityType.PISTOL, [EntityType.COWBOY_HAT, EntityType.SCOUTER]],
		[EntityType.PURPLE_GLOVE, [EntityType.PURPLE_HEADBAND]],
		[EntityType.RED_GLOVE, [EntityType.RED_HEADBAND]],
		[EntityType.SHOTGUN, [EntityType.COWBOY_HAT, EntityType.PURPLE_HEADBAND]],
		[EntityType.SNIPER, [EntityType.SCOUTER, EntityType.POCKET_ROCKET]],
		[EntityType.WING_CANNON, [EntityType.SCOUTER, EntityType.JETPACK]],
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
}