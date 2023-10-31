import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ArchRoom } from 'game/entity/block/arch_room'
import { ArchRoof } from 'game/entity/block/arch_roof'
import { Crate } from 'game/entity/crate'
import { ChickenBeak } from 'game/entity/equip/beak/chicken_beak'
import { ChickenHair } from 'game/entity/equip/headwear/chicken_hair'
import { BirdBrain } from 'game/entity/equip/bird_brain'
import { Explosion } from 'game/entity/explosion'
import { Player } from 'game/entity/player'
import { Bolt } from 'game/entity/projectile/bolt'
import { Rocket } from 'game/entity/projectile/rocket'
import { Console } from 'game/entity/sign/console'
import { SpawnPoint } from 'game/entity/spawn_point'
import { Wall } from 'game/entity/wall'
import { Bazooka } from 'game/entity/equip/weapon/bazooka'
import { Sniper } from 'game/entity/equip/weapon/sniper'

import { Vec } from 'util/vector'

export namespace EntityFactory {
	type EntityFactoryFn = (options : EntityOptions) => Entity;

	export const createFns = new Map<EntityType, EntityFactoryFn>([
		[EntityType.ARCH_ROOM, (options : EntityOptions) => { return new ArchRoom(options); }],
		[EntityType.ARCH_ROOF, (options : EntityOptions) => { return new ArchRoof(options); }],
		[EntityType.BAZOOKA, (options : EntityOptions) => { return new Bazooka(options); }],
		[EntityType.BIRD_BRAIN, (options : EntityOptions) => { return new BirdBrain(options); }],
		[EntityType.BOLT, (options : EntityOptions) => { return new Bolt(options); }],
		[EntityType.CHICKEN_BEAK, (options : EntityOptions) => { return new ChickenBeak(options); }],
		[EntityType.CHICKEN_HAIR, (options : EntityOptions) => { return new ChickenHair(options); }],
		[EntityType.CONSOLE, (options : EntityOptions) => { return new Console(options); }],
		[EntityType.CRATE, (options : EntityOptions) => { return new Crate(options); }],
		[EntityType.EXPLOSION, (options : EntityOptions) => { return new Explosion(options); }],
		[EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); }],
		[EntityType.ROCKET, (options : EntityOptions) => { return new Rocket(options); }],
		[EntityType.SNIPER, (options : EntityOptions) => { return new Sniper(options); }],
		[EntityType.SPAWN_POINT, (options : EntityOptions) => { return new SpawnPoint(options); }],
		[EntityType.WALL, (options : EntityOptions) => { return new Wall(options); }],
	]);

	export const staticDimensions = new Map<EntityType, Vec>([
		[EntityType.ARCH_ROOM, { x: 12, y: 6 }],
		[EntityType.ARCH_ROOF, { x: 12, y: 1 }],
		[EntityType.PLAYER, {x: 0.8, y: 1.44 }],
		[EntityType.SIGN, {x: 3, y: 2}],
		[EntityType.SPAWN_POINT, {x: 1, y: 1}],
	]);
	export const dimensions = new Map<EntityType, Vec>([
		...staticDimensions,
		[EntityType.CRATE, {x: 1, y: 1, z: 1 }],
	])

	export function hasCreateFn(type : EntityType) : boolean { return createFns.has(type); }
	export function create<T extends Entity>(type : EntityType, options : EntityOptions) : T {
		if (hasStaticDimension(type)) {
			if (!options.profileInit) {
				options.profileInit = {};
			}
			if (!options.profileInit.dim) {
				options.profileInit.dim = getStaticDimension(type);
			}
		}
		return <T>createFns.get(type)(options);
	}

	export function hasStaticDimension(type : EntityType) : boolean { return staticDimensions.has(type); }
	export function getStaticDimension(type : EntityType) : Vec {
		if (!hasDimension(type)) {
			console.error("Warning: missing dimension for", EntityType[type]);
			return { x: 1, y: 1, z: 1 };
		}
		return staticDimensions.get(type);
	}
	export function hasDimension(type : EntityType) : boolean { return dimensions.has(type); }
	export function getDimension(type : EntityType) : Vec {
		if (!hasDimension(type)) {
			console.error("Warning: missing dimension for", EntityType[type]);
			return { x: 1, y: 1, z: 1 };
		}
		return dimensions.get(type);
	}
}