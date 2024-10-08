import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BackgroundArchRoom } from 'game/entity/background/background_arch_room'
import { ArchBalcony } from 'game/entity/block/arch_balcony'
import { ArchRoom } from 'game/entity/block/arch_room'
import { ArchRoof } from 'game/entity/block/arch_roof'
import { Billboard } from 'game/entity/block/billboard'
import { Floor } from 'game/entity/bound/floor'
import { Wall } from 'game/entity/bound/wall'
import { Cloud } from 'game/entity/cloud'
import { DyingStar } from 'game/entity/dying_star'
import { Pergola } from 'game/entity/pergola'
import { Plane } from 'game/entity/plane'
import { Player } from 'game/entity/player'
import { Bubble } from 'game/entity/equip/bubble'
import { BirdBrain } from 'game/entity/equip/bird_brain'
import { Booster } from 'game/entity/equip/booster'
import { CowboyHat } from 'game/entity/equip/cowboy_hat'
import { Headband } from 'game/entity/equip/headband'
import { Headphones } from 'game/entity/equip/headphones'
import { Jetpack } from 'game/entity/equip/jetpack'
import { NameTag } from 'game/entity/equip/name_tag'
import { Scouter } from 'game/entity/equip/scouter'
import { BoobyBeak } from 'game/entity/equip/beak/booby_beak'
import { ChickenBeak } from 'game/entity/equip/beak/chicken_beak'
import { BoobyHair } from 'game/entity/equip/headwear/booby_hair'
import { ChickenHair } from 'game/entity/equip/headwear/chicken_hair'
import { Bazooka } from 'game/entity/equip/weapon/bazooka'
import { Claw } from 'game/entity/equip/weapon/claw'
import { Gatling } from 'game/entity/equip/weapon/gatling'
import { Pistol } from 'game/entity/equip/weapon/pistol'
import { Shotgun } from 'game/entity/equip/weapon/shotgun'
import { Sniper } from 'game/entity/equip/weapon/sniper'
import { WingCannon } from 'game/entity/equip/weapon/wing_cannon'
import { BlackHole } from 'game/entity/explosion/black_hole'
import { BoltExplosion } from 'game/entity/explosion/bolt_explosion'
import { OrbExplosion } from 'game/entity/explosion/orb_explosion'
import { RocketExplosion } from 'game/entity/explosion/rocket_explosion'
import { StarExplosion } from 'game/entity/explosion/star_explosion'
import { HealthCrate } from 'game/entity/interactable/crate/health_crate'
import { WeaponCrate } from 'game/entity/interactable/crate/weapon_crate'
import { Table } from 'game/entity/interactable/table'
import { ControlsSign } from 'game/entity/interactable/sign/controls_sign'
import { StartGameSign } from 'game/entity/interactable/sign/start_game_sign'
import { ParticleCube } from 'game/entity/particle/particle_cube'
import { ParticleEnergyCube } from 'game/entity/particle/particle_energy_cube'
import { ParticleSmoke } from 'game/entity/particle/particle_smoke'
import { ParticleSpark } from 'game/entity/particle/particle_spark'
import { ParticleSweat } from 'game/entity/particle/particle_sweat'
import { Bolt } from 'game/entity/projectile/bolt'
import { Bullet } from 'game/entity/projectile/bullet'
import { Caliber } from 'game/entity/projectile/caliber'
import { Laser } from 'game/entity/projectile/laser'
import { Orb } from 'game/entity/projectile/orb'
import { Pellet } from 'game/entity/projectile/pellet'
import { Rocket } from 'game/entity/projectile/rocket'
import { Star } from 'game/entity/projectile/star'
import { SpawnPoint } from 'game/entity/spawn_point'

import { Vec } from 'util/vector'

export namespace EntityFactory {
	type EntityFactoryFn = (options : EntityOptions) => Entity;

	export const createFns = new Map<EntityType, EntityFactoryFn>([
		[EntityType.ARCH_BALCONY, (options : EntityOptions) => { return new ArchBalcony(options); }],
		[EntityType.ARCH_ROOM, (options : EntityOptions) => { return new ArchRoom(options); }],
		[EntityType.ARCH_ROOF, (options : EntityOptions) => { return new ArchRoof(options); }],
		[EntityType.BACKGROUND_ARCH_ROOM, (options : EntityOptions) => { return new BackgroundArchRoom(options); }],
		[EntityType.BAZOOKA, (options : EntityOptions) => { return new Bazooka(options); }],
		[EntityType.BILLBOARD, (options : EntityOptions) => { return new Billboard(options); }],
		[EntityType.BIRD_BRAIN, (options : EntityOptions) => { return new BirdBrain(options); }],
		[EntityType.BOLT, (options : EntityOptions) => { return new Bolt(options); }],
		[EntityType.BOOSTER, (options : EntityOptions) => { return new Booster(options); }],
		[EntityType.BLACK_HOLE, (options : EntityOptions) => { return new BlackHole(options); }],
		[EntityType.BOLT_EXPLOSION, (options : EntityOptions) => { return new BoltExplosion(options); }],
		[EntityType.BOOBY_BEAK, (options : EntityOptions) => { return new BoobyBeak(options); }],
		[EntityType.BOOBY_HAIR, (options : EntityOptions) => { return new BoobyHair(options); }],
		[EntityType.BUBBLE, (options : EntityOptions) => { return new Bubble(options); }],
		[EntityType.BULLET, (options : EntityOptions) => { return new Bullet(options); }],
		[EntityType.CALIBER, (options : EntityOptions) => { return new Caliber(options); }],
		[EntityType.CHICKEN_BEAK, (options : EntityOptions) => { return new ChickenBeak(options); }],
		[EntityType.CHICKEN_HAIR, (options : EntityOptions) => { return new ChickenHair(options); }],
		[EntityType.CLAW, (options : EntityOptions) => { return new Claw(options); }],
		[EntityType.CLOUD, (options : EntityOptions) => { return new Cloud(options); }],
		[EntityType.CONTROLS_SIGN, (options : EntityOptions) => { return new ControlsSign(options); }],
		[EntityType.COWBOY_HAT, (options : EntityOptions) => { return new CowboyHat(options); }],
		[EntityType.DYING_STAR, (options : EntityOptions) => { return new DyingStar(options); }],
		[EntityType.FLOOR, (options : EntityOptions) => { return new Floor(options); }],
		[EntityType.GATLING, (options : EntityOptions) => { return new Gatling(options); }],
		[EntityType.HEADBAND, (options : EntityOptions) => { return new Headband(options); }],
		[EntityType.HEADPHONES, (options : EntityOptions) => { return new Headphones(options); }],
		[EntityType.HEALTH_CRATE, (options : EntityOptions) => { return new HealthCrate(options); }],
		[EntityType.JETPACK, (options : EntityOptions) => { return new Jetpack(options); }],
		[EntityType.LASER, (options : EntityOptions) => { return new Laser(options); }],
		[EntityType.NAME_TAG, (options : EntityOptions) => { return new NameTag(options); }],
		[EntityType.ORB, (options : EntityOptions) => { return new Orb(options); }],
		[EntityType.ORB_EXPLOSION, (options : EntityOptions) => { return new OrbExplosion(options); }],
		[EntityType.PARTICLE_CUBE, (options : EntityOptions) => { return new ParticleCube(options); }],
		[EntityType.PARTICLE_ENERGY_CUBE, (options : EntityOptions) => { return new ParticleEnergyCube(options); }],
		[EntityType.PARTICLE_SMOKE, (options : EntityOptions) => { return new ParticleSmoke(options); }],
		[EntityType.PARTICLE_SPARK, (options : EntityOptions) => { return new ParticleSpark(options); }],
		[EntityType.PARTICLE_SWEAT, (options : EntityOptions) => { return new ParticleSweat(options); }],
		[EntityType.PELLET, (options : EntityOptions) => { return new Pellet(options); }],
		[EntityType.PERGOLA, (options : EntityOptions) => { return new Pergola(options); }],
		[EntityType.PLANE, (options : EntityOptions) => { return new Plane(options); }],
		[EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); }],
		[EntityType.PISTOL, (options : EntityOptions) => { return new Pistol(options); }],
		[EntityType.ROCKET, (options : EntityOptions) => { return new Rocket(options); }],
		[EntityType.ROCKET_EXPLOSION, (options : EntityOptions) => { return new RocketExplosion(options); }],
		[EntityType.SCOUTER, (options : EntityOptions) => { return new Scouter(options); }],
		[EntityType.SHOTGUN, (options : EntityOptions) => { return new Shotgun(options); }],
		[EntityType.SNIPER, (options : EntityOptions) => { return new Sniper(options); }],
		[EntityType.SPAWN_POINT, (options : EntityOptions) => { return new SpawnPoint(options); }],
		[EntityType.STAR, (options : EntityOptions) => { return new Star(options); }],
		[EntityType.STAR_EXPLOSION, (options : EntityOptions) => { return new StarExplosion(options); }],
		[EntityType.START_GAME_SIGN, (options : EntityOptions) => { return new StartGameSign(options); }],
		[EntityType.TABLE, (options : EntityOptions) => { return new Table(options); }],
		[EntityType.WALL, (options : EntityOptions) => { return new Wall(options); }],
		[EntityType.WEAPON_CRATE, (options : EntityOptions) => { return new WeaponCrate(options); }],
		[EntityType.WING_CANNON, (options : EntityOptions) => { return new WingCannon(options); }],
	]);

	export const staticDimensions = new Map<EntityType, Vec>([
		[EntityType.ARCH_BALCONY, { x: 3, y: 2, z: 6 }],
		[EntityType.ARCH_ROOM, { x: 12, y: 6, z: 8 }],
		[EntityType.ARCH_ROOF, { x: 12, y: 1, z: 8 }],
		[EntityType.BACKGROUND_ARCH_ROOM, { x: 12, y: 6 }],
		[EntityType.BILLBOARD, { x: 8, y: 6.4, z: 0.5 }],
		[EntityType.BOLT, { x: 0.4, y: 0.12, z : 0.12 }],
		[EntityType.BULLET, { x: 0.4, y: 0.12, z : 0.12 }],
		[EntityType.CALIBER, { x: 0.5, y: 0.15, z : 0.15 }],
		[EntityType.LASER, { x: 25, y: 0.4, z : 0.1 }],
		[EntityType.ORB, { x: 0.3, y: 0.3, z : 0.3 }],
		[EntityType.PARTICLE_CUBE, { x: 1, y: 1, z: 1}],
		[EntityType.PARTICLE_ENERGY_CUBE, { x: 1, y: 1, z: 1}],
		[EntityType.PARTICLE_SMOKE, { x: 1, y: 1, z: 1 }],
		[EntityType.PARTICLE_SPARK, { x: 1, y: 1, z: 1 }],
		[EntityType.PARTICLE_SWEAT, { x: 1, y: 1, z: 1 }],
		[EntityType.PELLET, { x: 0.2, y: 0.2, z : 0.2 }],
		[EntityType.PERGOLA, { x: 4, y: 4, z: 4 }],
		[EntityType.PLANE, {x: 10.5, y: 4, z: 10.6 }],
		[EntityType.PLAYER, {x: 0.8, y: 1.44, z: 1 }],
		[EntityType.ROCKET, { x: 0.3, y: 0.3, z: 0.3 }],
		[EntityType.SIGN, {x: 1, y: 2, z: 0.2 }],
		[EntityType.SPAWN_POINT, {x: 1, y: 1, z: 1 }],
		[EntityType.STAR, {x: 0.35, y: 0.35, z: 0.1 }],
		[EntityType.TABLE, { x: 2, y: 1.25, z: 3 }],
	]);

	// Also includes dimensions that can change.
	export const dimensions = new Map<EntityType, Vec>([
		...staticDimensions,
		[EntityType.BLACK_HOLE, { x: 8, y: 8, z: 8 }],
		[EntityType.BOLT_EXPLOSION, { x: 3, y: 3, z: 3 }],
		[EntityType.DYING_STAR, { x: 0.5, y: 0.5, z: 0.5 }],
		[EntityType.HEALTH_CRATE, {x: 1, y: 1, z: 1 }],
		[EntityType.ORB_EXPLOSION, { x: 1.2, y: 1.2, z: 1.2 }],
		[EntityType.ROCKET_EXPLOSION, { x: 3, y: 3, z: 3 }],
		[EntityType.STAR_EXPLOSION, {x: 0.7, y: 0.7, z: 0.7 }],
		[EntityType.WEAPON_CRATE, {x: 1, y: 1, z: 1 }],
	]);

	export function hasCreateFn(type : EntityType) : boolean { return createFns.has(type); }
	export function create<T extends Entity>(type : EntityType, options : EntityOptions) : T {
		if (hasDimension(type)) {
			if (!options.profileInit) {
				options.profileInit = {};
			}
			if (!options.profileInit.dim) {
				options.profileInit.dim = getDimension(type);
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