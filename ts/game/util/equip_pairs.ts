
import { EntityType } from 'game/entity/api'

import { globalRandom, SeededRandom } from 'util/seeded_random'

export namespace EquipPairs {

	const pairs = new Map<EntityType, EntityType[]>([
		[EntityType.BAZOOKA, [EntityType.JETPACK]],
		[EntityType.CLAW, [EntityType.HEADBAND]],
		[EntityType.GATLING, [EntityType.HEADPHONES]],
		[EntityType.PISTOL, [EntityType.COWBOY_HAT]],
		[EntityType.SNIPER, [EntityType.SCOUTER]],
	]);

	const weapons = [...pairs.keys()];

	// [0, 1, 2, 3, ...]
	let indices = Array.from(Array(weapons.length).keys());	

	export function random() : [EntityType, EntityType] {
		return randomN(1)[0];
	}
	export function randomN(n : number) : [EntityType, EntityType][] {
		globalRandom.shuffle(indices, n);

		let pairs = [];

		for (let i = 0; i < n; ++i) {
			const weapon = weapons[indices[i]];
			pairs.push([weapon, getAltEquip(weapon)]);
		}
		return pairs;
	}

	export function randomIndex() : number {
		return globalRandom.int(weapons.length);
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