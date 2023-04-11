import { Entity, EntityOptions, EntityType } from 'game/entity'
import { ArchRoom } from 'game/entity/block/arch_room'
import { ArchRoof } from 'game/entity/block/arch_roof'
import { Crate } from 'game/entity/crate'
import { Explosion } from 'game/entity/explosion'
import { Player } from 'game/entity/player'
import { Rocket } from 'game/entity/projectile/rocket'
import { SpawnPoint } from 'game/entity/spawn_point'
import { Wall } from 'game/entity/wall'
import { Bazooka } from 'game/entity/weapon/bazooka'

import { Vec } from 'util/vector'

export namespace EntityFactory {
	type EntityFactoryFn = (options : EntityOptions) => Entity;

	export const createFns = new Map<EntityType, EntityFactoryFn>([
		[EntityType.ARCH_ROOM, (options : EntityOptions) => { return new ArchRoom(options); }],
		[EntityType.ARCH_ROOF, (options : EntityOptions) => { return new ArchRoof(options); }],
		[EntityType.BAZOOKA, (options : EntityOptions) => { return new Bazooka(options); }],
		[EntityType.CRATE, (options : EntityOptions) => { return new Crate(options); }],
		[EntityType.EXPLOSION, (options : EntityOptions) => { return new Explosion(options); }],
		[EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); }],
		[EntityType.ROCKET, (options : EntityOptions) => { return new Rocket(options); }],
		[EntityType.SPAWN_POINT, (options : EntityOptions) => { return new SpawnPoint(options); }],
		[EntityType.WALL, (options : EntityOptions) => { return new Wall(options); }],
	]);

	export const dimensions = new Map<EntityType, Vec>([
		[EntityType.ARCH_ROOM, { x: 12, y: 6 }],
		[EntityType.ARCH_ROOF, { x: 12, y: 1 }],
		[EntityType.PLAYER, {x: 0.8, y: 1.44 }],
		[EntityType.SPAWN_POINT, {x: 1, y: 1}],
	]);

	export function hasCreateFn(type : EntityType) : boolean { return createFns.has(type); }
	export function create<T extends Entity>(type : EntityType, options : EntityOptions) : T {
		if (hasDimension(type)) {
			if (!options.profileInit) {
				options.profileInit = {};
			}
			options.profileInit.dim = getDimension(type);
		}
		return <T>createFns.get(type)(options);
	}

	export function hasDimension(type : EntityType) : boolean { return dimensions.has(type); }
	export function getDimension(type : EntityType) : Vec { return dimensions.get(type); }
}