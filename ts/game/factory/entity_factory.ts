import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BackgroundArchRoom } from 'game/entity/background/background_arch_room'
import { ArchBalcony } from 'game/entity/block/arch_balcony'
import { ArchRoom } from 'game/entity/block/arch_room'
import { ArchRoof } from 'game/entity/block/arch_roof'
import { Floor } from 'game/entity/bound/floor'
import { Wall } from 'game/entity/bound/wall'
import { Cloud } from 'game/entity/cloud'
import { Crate } from 'game/entity/crate'
import { BoobyBeak } from 'game/entity/equip/beak/booby_beak'
import { ChickenBeak } from 'game/entity/equip/beak/chicken_beak'
import { Bubble } from 'game/entity/equip/bubble'
import { BoobyHair } from 'game/entity/equip/headwear/booby_hair'
import { ChickenHair } from 'game/entity/equip/headwear/chicken_hair'
import { BirdBrain } from 'game/entity/equip/bird_brain'
import { Jetpack } from 'game/entity/equip/jetpack'
import { NameTag } from 'game/entity/equip/name_tag'
import { Scouter } from 'game/entity/equip/scouter'
import { Explosion } from 'game/entity/explosion'
import { ParticleCube } from 'game/entity/particle/particle_cube'
import { ParticleSmoke } from 'game/entity/particle/particle_smoke'
import { ParticleSpark } from 'game/entity/particle/particle_spark'
import { Plane } from 'game/entity/plane'
import { Player } from 'game/entity/player'
import { Bolt } from 'game/entity/projectile/bolt'
import { Rocket } from 'game/entity/projectile/rocket'
import { SignStartGame } from 'game/entity/sign/sign_start_game'
import { SpawnPoint } from 'game/entity/spawn_point'
import { Bazooka } from 'game/entity/equip/weapon/bazooka'
import { Sniper } from 'game/entity/equip/weapon/sniper'

import { Vec } from 'util/vector'

export namespace EntityFactory {
	type EntityFactoryFn = (options : EntityOptions) => Entity;

	export const createFns = new Map<EntityType, EntityFactoryFn>([
		[EntityType.ARCH_BALCONY, (options : EntityOptions) => { return new ArchBalcony(options); }],
		[EntityType.ARCH_ROOM, (options : EntityOptions) => { return new ArchRoom(options); }],
		[EntityType.ARCH_ROOF, (options : EntityOptions) => { return new ArchRoof(options); }],
		[EntityType.BACKGROUND_ARCH_ROOM, (options : EntityOptions) => { return new BackgroundArchRoom(options); }],
		[EntityType.BAZOOKA, (options : EntityOptions) => { return new Bazooka(options); }],
		[EntityType.BIRD_BRAIN, (options : EntityOptions) => { return new BirdBrain(options); }],
		[EntityType.BOLT, (options : EntityOptions) => { return new Bolt(options); }],
		[EntityType.BOOBY_BEAK, (options : EntityOptions) => { return new BoobyBeak(options); }],
		[EntityType.BOOBY_HAIR, (options : EntityOptions) => { return new BoobyHair(options); }],
		[EntityType.BUBBLE, (options : EntityOptions) => { return new Bubble(options); }],
		[EntityType.CHICKEN_BEAK, (options : EntityOptions) => { return new ChickenBeak(options); }],
		[EntityType.CHICKEN_HAIR, (options : EntityOptions) => { return new ChickenHair(options); }],
		[EntityType.CLOUD, (options : EntityOptions) => { return new Cloud(options); }],
		[EntityType.CRATE, (options : EntityOptions) => { return new Crate(options); }],
		[EntityType.EXPLOSION, (options : EntityOptions) => { return new Explosion(options); }],
		[EntityType.FLOOR, (options : EntityOptions) => { return new Floor(options); }],
		[EntityType.JETPACK, (options : EntityOptions) => { return new Jetpack(options); }],
		[EntityType.NAME_TAG, (options : EntityOptions) => { return new NameTag(options); }],
		[EntityType.PARTICLE_CUBE, (options : EntityOptions) => { return new ParticleCube(options); }],
		[EntityType.PARTICLE_SMOKE, (options : EntityOptions) => { return new ParticleSmoke(options); }],
		[EntityType.PARTICLE_SPARK, (options : EntityOptions) => { return new ParticleSpark(options); }],
		[EntityType.PLANE, (options : EntityOptions) => { return new Plane(options); }],
		[EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); }],
		[EntityType.ROCKET, (options : EntityOptions) => { return new Rocket(options); }],
		[EntityType.SCOUTER, (options : EntityOptions) => { return new Scouter(options); }],
		[EntityType.SIGN_START_GAME, (options : EntityOptions) => { return new SignStartGame(options); }],
		[EntityType.SNIPER, (options : EntityOptions) => { return new Sniper(options); }],
		[EntityType.SPAWN_POINT, (options : EntityOptions) => { return new SpawnPoint(options); }],
		[EntityType.WALL, (options : EntityOptions) => { return new Wall(options); }],
	]);

	export const staticDimensions = new Map<EntityType, Vec>([
		[EntityType.ARCH_BALCONY, { x: 3, y: 2, z: 6 }],
		[EntityType.ARCH_ROOM, { x: 12, y: 6, z: 8 }],
		[EntityType.ARCH_ROOF, { x: 12, y: 1, z: 8 }],
		[EntityType.BACKGROUND_ARCH_ROOM, { x: 12, y: 6 }],
		[EntityType.BOLT, { x: 0.3, y: 0.12, z : 0.12 }],
		[EntityType.PARTICLE_CUBE, { x: 1, y: 1, z: 1}],
		[EntityType.PARTICLE_SMOKE, { x: 1, y: 1, z: 1 }],
		[EntityType.PARTICLE_SPARK, { x: 1, y: 1, z: 1 }],
		[EntityType.PLANE, {x: 10.5, y: 4, z: 10.6 }],
		[EntityType.PLAYER, {x: 0.8, y: 1.44, z: 1 }],
		[EntityType.ROCKET, { x: 0.3, y: 0.3, z: 0.3 }],
		[EntityType.SIGN, {x: 3, y: 2, z: 0.2 }],
		[EntityType.SPAWN_POINT, {x: 1, y: 1, z: 1 }],
	]);

	// Also includes dimensions that can change.
	export const dimensions = new Map<EntityType, Vec>([
		...staticDimensions,
		[EntityType.CRATE, {x: 1, y: 1, z: 1 }],
	]);

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