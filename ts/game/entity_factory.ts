import { Entity, EntityOptions, EntityType } from 'game/entity'
import { ArchRoom } from 'game/entity/block/arch_room'
import { ArchRoof } from 'game/entity/block/arch_roof'
import { Crate } from 'game/entity/crate'
import { Explosion } from 'game/entity/explosion'
import { Player } from 'game/entity/player'
import { Rocket } from 'game/entity/projectile/rocket'
import { Wall } from 'game/entity/wall'
import { Bazooka } from 'game/entity/weapon/bazooka'

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
		[EntityType.WALL, (options : EntityOptions) => { return new Wall(options); }],
	]);

	export function hasType(type : EntityType) : boolean { return createFns.has(type); }

	export function create<T extends Entity>(type : EntityType, options : EntityOptions) : T {
		return <T>createFns.get(type)(options);
	}
}