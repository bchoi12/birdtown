
import { EntityType } from 'game/entity/api'

import { globalRandom } from 'util/seeded_random'

export namespace EquipPairs {

	const pairs = new Map<EntityType, EntityType[]>([
		[EntityType.BAZOOKA, [EntityType.JETPACK, EntityType.COWBOY_HAT]],
		[EntityType.GATLING, [EntityType.BOOSTER, EntityType.HEADPHONES]],
		[EntityType.PISTOL, [EntityType.COWBOY_HAT, EntityType.SCOUTER]],
		[EntityType.PURPLE_GLOVE, [EntityType.PURPLE_HEADBAND]],
		[EntityType.RED_GLOVE, [EntityType.RED_HEADBAND]],
		[EntityType.SHOTGUN, [EntityType.COWBOY_HAT, EntityType.PURPLE_HEADBAND]],
		[EntityType.SNIPER, [EntityType.SCOUTER, EntityType.POCKET_ROCKET]],
		[EntityType.WING_CANNON, [EntityType.SCOUTER, EntityType.JETPACK]],
	]);

	const weapons = [...pairs.keys()];

	// [0, 1, 2, 3, ...]
	let indices = Array.from(Array(weapons.length).keys());

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

	export function randomIndex() : number {
		return globalRandom.int(weapons.length);
	}
	export function randomDefaultPair() : [EntityType, EntityType] {
		return getDefaultPair(randomIndex());
	}
	export function getDefaultPair(index : number) : [EntityType, EntityType] {
		return [weapons[index], pairs.get(weapons[index])[0]];
	}
	export function getDefaultPairExcluding(index : number, type : EntityType) : [EntityType, EntityType] {
		if (weapons[index] !== type) {
			return getDefaultPair(index);
		}

		index++;
		if (index >= weapons.length) {
			index = 0;
		}
		return this.getDefaultPair(index);
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