import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BackgroundArchRoom } from 'game/entity/background/background_arch_room'
import { ArchBalcony } from 'game/entity/block/arch_balcony'
import { ArchRoom } from 'game/entity/block/arch_room'
import { ArchRoof } from 'game/entity/block/arch_roof'
import { Billboard } from 'game/entity/block/billboard'
import { Bush } from 'game/entity/block/bush'
import { BottomCliff, BottomMiniCliff, BottomCliffWall } from 'game/entity/block/cliff/bottom_cliff'
import { TopCliff, TopMiniCliff, TopCliffWall } from 'game/entity/block/cliff/top_cliff'
import { Tree } from 'game/entity/block/tree'
import { Bound } from 'game/entity/bound'
import { Floor } from 'game/entity/bound/floor'
import { Platform, UnderwaterRock } from 'game/entity/bound/platform'
import { Cloud } from 'game/entity/cloud'
import { DyingStar } from 'game/entity/dying_star'
import { Pergola } from 'game/entity/pergola'
import { Plane } from 'game/entity/plane'
import { Player } from 'game/entity/player'
import { BlockEnemy } from 'game/entity/enemy/block_enemy'
import { BlackHeadband } from 'game/entity/equip/black_headband'
import { Bubble } from 'game/entity/equip/bubble'
import { Booster } from 'game/entity/equip/booster'
import { CowboyHat } from 'game/entity/equip/cowboy_hat'
import { Headphones } from 'game/entity/equip/headphones'
import { Jetpack } from 'game/entity/equip/jetpack'
import { NameTag } from 'game/entity/equip/name_tag'
import { PocketRocket } from 'game/entity/equip/pocket_rocket'
import { PurpleHeadband } from 'game/entity/equip/purple_headband'
import { RedHeadband } from 'game/entity/equip/red_headband'
import { Scouter } from 'game/entity/equip/scouter'
import { Shades } from 'game/entity/equip/shades'
import { ShieldRing } from 'game/entity/equip/shield_ring'
import { TopHat } from 'game/entity/equip/top_hat'
import { BoobyBeak } from 'game/entity/equip/beak/booby_beak'
import { CardinalBeak } from 'game/entity/equip/beak/cardinal_beak'
import { ChickenBeak } from 'game/entity/equip/beak/chicken_beak'
import { DuckBeak } from 'game/entity/equip/beak/duck_beak'
import { EagleBeak } from 'game/entity/equip/beak/eagle_beak'
import { FlamingoBeak } from 'game/entity/equip/beak/flamingo_beak'
import { PigeonBeak } from 'game/entity/equip/beak/pigeon_beak'
import { RavenBeak } from 'game/entity/equip/beak/raven_beak'
import { RobinBeak } from 'game/entity/equip/beak/robin_beak'
import { BoobyHair } from 'game/entity/equip/headwear/booby_hair'
import { CardinalHair } from 'game/entity/equip/headwear/cardinal_hair'
import { ChickenHair } from 'game/entity/equip/headwear/chicken_hair'
import { FlamingoHair } from 'game/entity/equip/headwear/flamingo_hair'
import { PigeonHair } from 'game/entity/equip/headwear/pigeon_hair'
import { RavenHair } from 'game/entity/equip/headwear/raven_hair'
import { RobinHair } from 'game/entity/equip/headwear/robin_hair'
import { Bazooka } from 'game/entity/equip/weapon/bazooka'
import { Gatling } from 'game/entity/equip/weapon/gatling'
import { GoldenGun } from 'game/entity/equip/weapon/golden_gun'
import { LaserCannon } from 'game/entity/equip/weapon/laser_cannon'
import { LaserGun } from 'game/entity/equip/weapon/laser_gun'
import { Minigun } from 'game/entity/equip/weapon/minigun'
import { OrbCannon } from 'game/entity/equip/weapon/orb_cannon'
import { Pistol } from 'game/entity/equip/weapon/pistol'
import { PurpleGlove } from 'game/entity/equip/weapon/purple_glove'
import { RedGlove } from 'game/entity/equip/weapon/red_glove'
import { Rifle } from 'game/entity/equip/weapon/rifle'
import { Shotgun } from 'game/entity/equip/weapon/shotgun'
import { WingCannon } from 'game/entity/equip/weapon/wing_cannon'
import { BlackHole } from 'game/entity/explosion/black_hole'
import { BoltExplosion } from 'game/entity/explosion/bolt_explosion'
import { GoldenExplosion } from 'game/entity/explosion/golden_explosion'
import { MegaRocketExplosion } from 'game/entity/explosion/mega_rocket_explosion'
import { MiniOrbExplosion } from 'game/entity/explosion/mini_orb_explosion'
import { OrbExplosion } from 'game/entity/explosion/orb_explosion'
import { PurpleBoltExplosion } from 'game/entity/explosion/purple_bolt_explosion'
import { RocketExplosion } from 'game/entity/explosion/rocket_explosion'
import { SquawkShield, MegaSquawkShield } from 'game/entity/explosion/squawk_shield'
import { StarExplosion } from 'game/entity/explosion/star_explosion'
import { BuffCrate } from 'game/entity/interactable/crate/buff_crate'
import { HealthCrate } from 'game/entity/interactable/crate/health_crate'
import { WeaponCrate } from 'game/entity/interactable/crate/weapon_crate'
import { Table } from 'game/entity/interactable/table'
import { ControlsSign } from 'game/entity/interactable/sign/controls_sign'
import { HikingSign } from 'game/entity/interactable/sign/hiking_sign'
import { RematchSign } from 'game/entity/interactable/sign/rematch_sign'
import { StartGameSign } from 'game/entity/interactable/sign/start_game_sign'
import { CubeParticle } from 'game/entity/particle/cube_particle'
import { EnergyCubeParticle } from 'game/entity/particle/energy_cube_particle'
import { MuzzleParticle } from 'game/entity/particle/muzzle_particle'
import { LaunchParticle } from 'game/entity/particle/launch_particle'
import { RingParticle } from 'game/entity/particle/ring_particle'
import { SmokeParticle } from 'game/entity/particle/smoke_particle'
import { SparkParticle } from 'game/entity/particle/spark_particle'
import { SphereParticle } from 'game/entity/particle/sphere_particle'
import { SweatParticle } from 'game/entity/particle/sweat_particle'
import { TextParticle } from 'game/entity/particle/text_particle'
import { WaterParticle } from 'game/entity/particle/water_particle'
import { Bolt } from 'game/entity/projectile/bolt'
import { Bullet } from 'game/entity/projectile/bullet'
import { Caliber } from 'game/entity/projectile/caliber'
import { Cartridge } from 'game/entity/projectile/cartridge'
import { ChargedBolt } from 'game/entity/projectile/charged_bolt'
import { GoldenBullet, BeakBullet } from 'game/entity/projectile/golden_bullet'
import { Knife, PoisoningKnife } from 'game/entity/projectile/knife'
import { Laser, PurpleLaser } from 'game/entity/projectile/laser'
import { MegaRocket } from 'game/entity/projectile/mega_rocket'
import { MiniRocket } from 'game/entity/projectile/mini_rocket'
import { MiniOrb } from 'game/entity/projectile/mini_orb'
import { Orb } from 'game/entity/projectile/orb'
import { Pellet } from 'game/entity/projectile/pellet'
import { Piercer } from 'game/entity/projectile/piercer'
import { PurpleBolt } from 'game/entity/projectile/purple_bolt'
import { Rocket } from 'game/entity/projectile/rocket'
import { Star } from 'game/entity/projectile/star'
import { SpawnPoint } from 'game/entity/spawn_point'
import { Water } from 'game/entity/water'

import { Vec } from 'util/vector'

export namespace EntityFactory {
	type EntityFactoryFn = (options : EntityOptions) => Entity;

	export const createFns = new Map<EntityType, EntityFactoryFn>([
		[EntityType.ARCH_BALCONY, (options : EntityOptions) => { return new ArchBalcony(options); }],
		[EntityType.ARCH_ROOM, (options : EntityOptions) => { return new ArchRoom(options); }],
		[EntityType.ARCH_ROOF, (options : EntityOptions) => { return new ArchRoof(options); }],
		[EntityType.BACKGROUND_ARCH_ROOM, (options : EntityOptions) => { return new BackgroundArchRoom(options); }],
		[EntityType.BAZOOKA, (options : EntityOptions) => { return new Bazooka(options); }],
		[EntityType.BEAK_BULLET, (options : EntityOptions) => { return new BeakBullet(options); }],
		[EntityType.BILLBOARD, (options : EntityOptions) => { return new Billboard(options); }],
		[EntityType.BLACK_HEADBAND, (options : EntityOptions) => { return new BlackHeadband(options); }],
		[EntityType.BLACK_HOLE, (options : EntityOptions) => { return new BlackHole(options); }],
		[EntityType.BLOCK_ENEMY, (options : EntityOptions) => { return new BlockEnemy(options); }],
		[EntityType.BOLT, (options : EntityOptions) => { return new Bolt(options); }],
		[EntityType.BOOSTER, (options : EntityOptions) => { return new Booster(options); }],
		[EntityType.BOLT_EXPLOSION, (options : EntityOptions) => { return new BoltExplosion(options); }],
		[EntityType.BOOBY_BEAK, (options : EntityOptions) => { return new BoobyBeak(options); }],
		[EntityType.BOOBY_HAIR, (options : EntityOptions) => { return new BoobyHair(options); }],
		[EntityType.BOTTOM_CLIFF, (options : EntityOptions) => { return new BottomCliff(options); }],
		[EntityType.BOTTOM_CLIFF_WALL, (options : EntityOptions) => { return new BottomCliffWall(options); }],
		[EntityType.BOTTOM_MINI_CLIFF, (options : EntityOptions) => { return new BottomMiniCliff(options); }],
		[EntityType.BOUND, (options : EntityOptions) => { return new Bound(options); }],
		[EntityType.BUBBLE, (options : EntityOptions) => { return new Bubble(options); }],
		[EntityType.BUFF_CRATE, (options : EntityOptions) => { return new BuffCrate(options); }],
		[EntityType.BULLET, (options : EntityOptions) => { return new Bullet(options); }],
		[EntityType.BUSH, (options : EntityOptions) => { return new Bush(options); }],
		[EntityType.CALIBER, (options : EntityOptions) => { return new Caliber(options); }],
		[EntityType.CARDINAL_BEAK, (options : EntityOptions) => { return new CardinalBeak(options); }],
		[EntityType.CARDINAL_HAIR, (options : EntityOptions) => { return new CardinalHair(options); }],
		[EntityType.CARTRIDGE, (options : EntityOptions) => { return new Cartridge(options); }],
		[EntityType.CHARGED_BOLT, (options : EntityOptions) => { return new ChargedBolt(options); }],
		[EntityType.CHICKEN_BEAK, (options : EntityOptions) => { return new ChickenBeak(options); }],
		[EntityType.CHICKEN_HAIR, (options : EntityOptions) => { return new ChickenHair(options); }],
		[EntityType.CLOUD, (options : EntityOptions) => { return new Cloud(options); }],
		[EntityType.CONTROLS_SIGN, (options : EntityOptions) => { return new ControlsSign(options); }],
		[EntityType.COWBOY_HAT, (options : EntityOptions) => { return new CowboyHat(options); }],
		[EntityType.DUCK_BEAK, (options : EntityOptions) => { return new DuckBeak(options); }],
		[EntityType.DYING_STAR, (options : EntityOptions) => { return new DyingStar(options); }],
		[EntityType.EAGLE_BEAK, (options : EntityOptions) => { return new EagleBeak(options); }],
		[EntityType.FLAMINGO_BEAK, (options : EntityOptions) => { return new FlamingoBeak(options); }],
		[EntityType.FLAMINGO_HAIR, (options : EntityOptions) => { return new FlamingoHair(options); }],
		[EntityType.FLOOR, (options : EntityOptions) => { return new Floor(options); }],
		[EntityType.GATLING, (options : EntityOptions) => { return new Gatling(options); }],
		[EntityType.GOLDEN_BULLET, (options : EntityOptions) => { return new GoldenBullet(options); }],
		[EntityType.GOLDEN_EXPLOSION, (options : EntityOptions) => { return new GoldenExplosion(options); }],
		[EntityType.GOLDEN_GUN, (options : EntityOptions) => { return new GoldenGun(options); }],
		[EntityType.HEADPHONES, (options : EntityOptions) => { return new Headphones(options); }],
		[EntityType.HEALTH_CRATE, (options : EntityOptions) => { return new HealthCrate(options); }],
		[EntityType.HIKING_SIGN, (options : EntityOptions) => { return new HikingSign(options); }],
		[EntityType.JETPACK, (options : EntityOptions) => { return new Jetpack(options); }],
		[EntityType.KNIFE, (options : EntityOptions) => { return new Knife(options); }],
		[EntityType.LASER, (options : EntityOptions) => { return new Laser(options); }],
		[EntityType.LASER_CANNON, (options : EntityOptions) => { return new LaserCannon(options); }],
		[EntityType.LASER_GUN, (options : EntityOptions) => { return new LaserGun(options); }],
		[EntityType.MEGA_SQUAWK_SHIELD, (options : EntityOptions) => { return new MegaSquawkShield(options); }],
		[EntityType.MEGA_ROCKET, (options : EntityOptions) => { return new MegaRocket(options); }],
		[EntityType.MEGA_ROCKET_EXPLOSION, (options : EntityOptions) => { return new MegaRocketExplosion(options); }],
		[EntityType.MINIGUN, (options : EntityOptions) => { return new Minigun(options); }],
		[EntityType.MINI_ORB, (options : EntityOptions) => { return new MiniOrb(options); }],
		[EntityType.MINI_ORB_EXPLOSION, (options : EntityOptions) => { return new MiniOrbExplosion(options); }],
		[EntityType.MINI_ROCKET, (options : EntityOptions) => { return new MiniRocket(options); }],
		[EntityType.NAME_TAG, (options : EntityOptions) => { return new NameTag(options); }],
		[EntityType.ORB, (options : EntityOptions) => { return new Orb(options); }],
		[EntityType.ORB_CANNON, (options : EntityOptions) => { return new OrbCannon(options); }],
		[EntityType.ORB_EXPLOSION, (options : EntityOptions) => { return new OrbExplosion(options); }],
		[EntityType.PELLET, (options : EntityOptions) => { return new Pellet(options); }],
		[EntityType.PERGOLA, (options : EntityOptions) => { return new Pergola(options); }],
		[EntityType.PIERCER, (options : EntityOptions) => { return new Piercer(options); }],
		[EntityType.PIGEON_BEAK, (options : EntityOptions) => { return new PigeonBeak(options); }],
		[EntityType.PIGEON_HAIR, (options : EntityOptions) => { return new PigeonHair(options); }],
		[EntityType.PLANE, (options : EntityOptions) => { return new Plane(options); }],
		[EntityType.PLATFORM, (options : EntityOptions) => { return new Platform(options); }],
		[EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); }],
		[EntityType.PISTOL, (options : EntityOptions) => { return new Pistol(options); }],
		[EntityType.POCKET_ROCKET, (options : EntityOptions) => { return new PocketRocket(options); }],
		[EntityType.POISONING_KNIFE, (options : EntityOptions) => { return new PoisoningKnife(options); }],
		[EntityType.PURPLE_BOLT, (options : EntityOptions) => { return new PurpleBolt(options); }],
		[EntityType.PURPLE_BOLT_EXPLOSION, (options : EntityOptions) => { return new PurpleBoltExplosion(options); }],
		[EntityType.PURPLE_GLOVE, (options : EntityOptions) => { return new PurpleGlove(options); }],
		[EntityType.PURPLE_HEADBAND, (options : EntityOptions) => { return new PurpleHeadband(options); }],
		[EntityType.PURPLE_LASER, (options : EntityOptions) => { return new PurpleLaser(options); }],
		[EntityType.RAVEN_BEAK, (options : EntityOptions) => { return new RavenBeak(options); }],
		[EntityType.RAVEN_HAIR, (options : EntityOptions) => { return new RavenHair(options); }],
		[EntityType.RED_GLOVE, (options : EntityOptions) => { return new RedGlove(options); }],
		[EntityType.RED_HEADBAND, (options : EntityOptions) => { return new RedHeadband(options); }],
		[EntityType.REMATCH_SIGN, (options : EntityOptions) => { return new RematchSign(options); }],
		[EntityType.RIFLE, (options : EntityOptions) => { return new Rifle(options); }],
		[EntityType.ROBIN_BEAK, (options : EntityOptions) => { return new RobinBeak(options); }],
		[EntityType.ROBIN_HAIR, (options : EntityOptions) => { return new RobinHair(options); }],
		[EntityType.ROCKET, (options : EntityOptions) => { return new Rocket(options); }],
		[EntityType.ROCKET_EXPLOSION, (options : EntityOptions) => { return new RocketExplosion(options); }],
		[EntityType.SCOUTER, (options : EntityOptions) => { return new Scouter(options); }],
		[EntityType.SHADES, (options : EntityOptions) => { return new Shades(options); }],
		[EntityType.SHIELD_RING, (options : EntityOptions) => { return new ShieldRing(options); }],
		[EntityType.SHOTGUN, (options : EntityOptions) => { return new Shotgun(options); }],
		[EntityType.SPAWN_POINT, (options : EntityOptions) => { return new SpawnPoint(options); }],
		[EntityType.SQUAWK_SHIELD, (options : EntityOptions) => { return new SquawkShield(options); }],
		[EntityType.STAR, (options : EntityOptions) => { return new Star(options); }],
		[EntityType.STAR_EXPLOSION, (options : EntityOptions) => { return new StarExplosion(options); }],
		[EntityType.START_GAME_SIGN, (options : EntityOptions) => { return new StartGameSign(options); }],
		[EntityType.TABLE, (options : EntityOptions) => { return new Table(options); }],
		[EntityType.TOP_CLIFF, (options : EntityOptions) => { return new TopCliff(options); }],
		[EntityType.TOP_CLIFF_WALL, (options : EntityOptions) => { return new TopCliffWall(options); }],
		[EntityType.TOP_MINI_CLIFF, (options : EntityOptions) => { return new TopMiniCliff(options); }],
		[EntityType.TOP_HAT, (options : EntityOptions) => { return new TopHat(options); }],
		[EntityType.TREE, (options : EntityOptions) => { return new Tree(options); }],
		[EntityType.UNDERWATER_ROCK, (options : EntityOptions) => { return new UnderwaterRock(options); }],
		[EntityType.WATER, (options : EntityOptions) => { return new Water(options); }],
		[EntityType.WEAPON_CRATE, (options : EntityOptions) => { return new WeaponCrate(options); }],
		[EntityType.WING_CANNON, (options : EntityOptions) => { return new WingCannon(options); }],

		[EntityType.CUBE_PARTICLE, (options : EntityOptions) => { return new CubeParticle(options); }],
		[EntityType.ENERGY_CUBE_PARTICLE, (options : EntityOptions) => { return new EnergyCubeParticle(options); }],
		[EntityType.MUZZLE_PARTICLE, (options : EntityOptions) => { return new MuzzleParticle(options); }],
		[EntityType.LAUNCH_PARTICLE, (options : EntityOptions) => { return new LaunchParticle(options); }],
		[EntityType.RING_PARTICLE, (options : EntityOptions) => { return new RingParticle(options); }],
		[EntityType.SMOKE_PARTICLE, (options : EntityOptions) => { return new SmokeParticle(options); }],
		[EntityType.SPARK_PARTICLE, (options : EntityOptions) => { return new SparkParticle(options); }],
		[EntityType.SPHERE_PARTICLE, (options : EntityOptions) => { return new SphereParticle(options); }],
		[EntityType.SWEAT_PARTICLE, (options : EntityOptions) => { return new SweatParticle(options); }],
		[EntityType.TEXT_PARTICLE, (options : EntityOptions) => { return new TextParticle(options); }],
		[EntityType.WATER_PARTICLE, (options : EntityOptions) => { return new WaterParticle(options); }],
	]);

	export const staticDimensions = new Map<EntityType, Vec>([
		[EntityType.ARCH_BALCONY, { x: 3, y: 2, z: 6 }],
		[EntityType.ARCH_ROOM, { x: 12, y: 6, z: 8 }],
		[EntityType.ARCH_ROOF, { x: 12, y: 1, z: 8 }],
		[EntityType.BACKGROUND_ARCH_ROOM, { x: 12, y: 6 }],
		[EntityType.BEAK_BULLET, { x: 0.6, y: 0.18, z : 0.18 }],
		[EntityType.BILLBOARD, { x: 8, y: 6.4, z: 0.5 }],
		[EntityType.BUSH, { x: 3.3, y: 2 }],
		[EntityType.BOLT, { x: 0.7, y: 0.15, z : 0.15 }],
		[EntityType.BOTTOM_CLIFF, { x: 15, y: 7 }],
		[EntityType.BOTTOM_CLIFF_WALL, { x: 15, y: 7 }],
		[EntityType.BOTTOM_MINI_CLIFF, { x: 5, y: 7 }],
		[EntityType.BULLET, { x: 0.5, y: 0.15, z : 0.15 }],
		[EntityType.CALIBER, { x: 0.6, y: 0.18, z : 0.18 }],
		[EntityType.CARTRIDGE, { x: 0.8, y: 0.18, z : 0.18 }],
		[EntityType.CHARGED_BOLT, { x: 1.4, y: 0.24, z : 0.24 }],
		[EntityType.CLIFF, { x: 15, y: 7 }],
		[EntityType.CLIFF_WALL, { x: 15, y: 7 }],
		[EntityType.GOLDEN_BULLET, { x: 0.6, y: 0.18, z : 0.18 }],
		[EntityType.KNIFE, {x: 0.6, y: 0.3, z: 0.2 }],
		[EntityType.LASER, { x: 28, y: 0.5, z : 0.1 }],
		[EntityType.MEGA_ROCKET, { x: 0.4, y: 0.4, z: 0.4 }],
		[EntityType.MINI_CLIFF, { x: 5, y: 7 }],
		[EntityType.MINI_ROCKET, { x: 0.4, y: 0.4, z: 0.4 }],
		[EntityType.MINI_ORB, { x: 0.35, y: 0.35, z: 0.35 }],
		[EntityType.ORB, { x: 0.4, y: 0.4, z : 0.4 }],
		[EntityType.PELLET, { x: 0.2, y: 0.2, z : 0.2 }],
		[EntityType.PERGOLA, { x: 4, y: 4, z: 4 }],
		[EntityType.PIERCER, { x: 0.8, y: 0.18, z : 0.18 }],
		[EntityType.PLANE, {x: 10.5, y: 4, z: 10.6 }],
		[EntityType.PLAYER, {x: 0.8, y: 1.44, z: 1 }],
		[EntityType.POISONING_KNIFE, {x: 0.6, y: 0.3, z: 0.2 }],
		[EntityType.PURPLE_BOLT, { x: 0.9, y: 0.18, z : 0.18 }],
		[EntityType.PURPLE_LASER, { x: 28, y: 0.35, z : 0.1 }],
		[EntityType.ROCKET, { x: 0.4, y: 0.4, z: 0.4 }],
		[EntityType.SIGN, {x: 1, y: 2, z: 0.2 }],
		[EntityType.SPAWN_POINT, {x: 1, y: 1, z: 1 }],
		[EntityType.STAR, {x: 0.35, y: 0.35, z: 0.1 }],
		[EntityType.TABLE, { x: 2, y: 1.25, z: 3 }],
		[EntityType.TOP_CLIFF, { x: 15, y: 7 }],
		[EntityType.TOP_CLIFF_WALL, { x: 15, y: 7 }],
		[EntityType.TOP_MINI_CLIFF, { x: 5, y: 7 }],
		[EntityType.TREE, { x: 3, y: 4.75, z: 3 }],

		[EntityType.CUBE_PARTICLE, { x: 1, y: 1, z: 1}],
		[EntityType.ENERGY_CUBE_PARTICLE, { x: 1, y: 1, z: 1}],
		[EntityType.MUZZLE_PARTICLE, { x: 1, y: 1, z: 1 }],
		[EntityType.LAUNCH_PARTICLE, { x: 1, y: 1, z: 1 }],
		[EntityType.RING_PARTICLE, { x: 1, y: 1, z: 1 }],
		[EntityType.SMOKE_PARTICLE, { x: 1, y: 1, z: 1 }],
		[EntityType.SPARK_PARTICLE, { x: 1, y: 1, z: 1 }],
		[EntityType.SPHERE_PARTICLE, { x: 1, y: 1, z: 1 }],
		[EntityType.SWEAT_PARTICLE, { x: 1, y: 1, z: 1 }],
		[EntityType.TEXT_PARTICLE, { x: 1, y: 1, z: 1 }],
		[EntityType.WATER_PARTICLE, { x: 1, y: 1, z: 1 }],
	]);

	// Also includes dimensions that can change.
	export const dimensions = new Map<EntityType, Vec>([
		...staticDimensions,
		[EntityType.BLACK_HOLE, { x: 8, y: 8, z: 8 }],
		[EntityType.BLOCK_ENEMY, { x: 1, y: 1, z: 1 }],
		[EntityType.BOLT_EXPLOSION, { x: 3, y: 3, z: 3 }],
		[EntityType.BUFF_CRATE, {x: 1, y: 1, z: 1 }],
		[EntityType.DYING_STAR, { x: 0.5, y: 0.5, z: 0.5 }],
		[EntityType.GOLDEN_EXPLOSION, { x: 2.5, y: 2.5, z: 2.5 }],
		[EntityType.HEALTH_CRATE, {x: 1, y: 1, z: 1 }],
		[EntityType.MEGA_ROCKET_EXPLOSION, { x: 8, y: 8, z: 8 }],
		[EntityType.MEGA_SQUAWK_SHIELD, { x: 7, y: 7, z: 7 }],
		[EntityType.MINI_ORB_EXPLOSION, {x: 1, y: 1, z: 1 }],
		[EntityType.ORB_EXPLOSION, { x: 1.8, y: 1.8, z: 1.8 }],
		[EntityType.PURPLE_BOLT_EXPLOSION, { x: 2.2, y: 2.2, z: 2.2 }],
		[EntityType.ROCKET_EXPLOSION, { x: 3, y: 3, z: 3 }],
		[EntityType.SQUAWK_SHIELD, { x: 5, y: 5, z: 5 }],
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