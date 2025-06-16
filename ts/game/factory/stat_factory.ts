
import { game } from 'game'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { StatType } from 'game/factory/api'

export namespace StatFactory {
	const entityStats = new Map<EntityType, Map<StatType, number>>([

		[EntityType.HEALTH_CRATE, new Map([
			[StatType.HEALTH, 40],
		])],
		[EntityType.PLAYER, new Map([
			[StatType.HEALTH, 100],
		])],
		[EntityType.WEAPON_CRATE, new Map([
			[StatType.HEALTH, 40],
		])],

		// Equips
		[EntityType.BOOBY_BEAK, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.CHARGE_RATE, 33],
			[StatType.USE_JUICE, 33],
		])],
		[EntityType.CHICKEN_BEAK, new Map([
			[StatType.CHARGE_DELAY, 500],
			[StatType.CHARGE_RATE, 50],
			[StatType.USE_JUICE, 50],
		])],
		[EntityType.DUCK_BEAK, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.CHARGE_RATE, 33],
			[StatType.USE_JUICE, 33],
		])],
		[EntityType.EAGLE_BEAK, new Map([
			[StatType.CHARGE_DELAY, 1000],
			[StatType.CHARGE_RATE, 33],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.ROBIN_BEAK, new Map([
			[StatType.CHARGE_DELAY, 500],
			[StatType.CHARGE_RATE, 50],
			[StatType.USE_JUICE, 50],
		])],
		[EntityType.BOOSTER, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.CHARGE_RATE, 50],
			[StatType.FAST_CHARGE_RATE, 125],
			[StatType.FORCE, 2],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.COWBOY_HAT, new Map([
			[StatType.CHARGE_DELAY, 600],
			[StatType.CHARGE_RATE, 70],
			[StatType.FORCE, 0.6],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.HEADPHONES, new Map([
			[StatType.CHARGE_RATE, 50],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.HEADPHONES, new Map([
			[StatType.CHARGE_RATE, 50],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.JETPACK, new Map([
			[StatType.CHARGE_DELAY, 400],
			[StatType.CHARGE_RATE, 50],
			[StatType.FAST_CHARGE_RATE, 300],
			// Adjusted by time
			[StatType.USE_JUICE, 0.1],
		])],
		[EntityType.POCKET_ROCKET, new Map([
			[StatType.CHARGE_DELAY, 500],
			[StatType.CHARGE_RATE, 33],
			[StatType.PROJECTILE_ACCEL, 1.5],
			[StatType.PROJECTILE_SPEED, 0.1],
			[StatType.PROJECTILE_TTL, 600],
			[StatType.USE_JUICE, 50],
		])],
		[EntityType.PURPLE_HEADBAND, new Map([
			[StatType.CHARGE_DELAY, 400],
			[StatType.CHARGE_RATE, 40],
			[StatType.FAST_CHARGE_RATE, 80],
			[StatType.FORCE, 0.8],
			[StatType.USE_JUICE, 45],
		])],
		[EntityType.RED_HEADBAND, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.CHARGE_RATE, 110],
			[StatType.FAST_CHARGE_RATE, 170],
			[StatType.FORCE, -0.8],
			[StatType.PROJECTILE_SPEED, 0.85],
			[StatType.PROJECTILE_TTL, 550],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.TOP_HAT, new Map([
			[StatType.CHARGE_DELAY, 275],
			[StatType.CHARGE_RATE, 200],
			[StatType.FORCE, 0.6],
			[StatType.USE_JUICE, 100],
		])],

		// Weapons
		[EntityType.BAZOOKA, new Map([
			[StatType.BURSTS, 1],
			[StatType.CHARGED_BURSTS, 1],
			[StatType.CHARGED_FIRE_TIME, 500],
			[StatType.CHARGED_FORCE, 0.75],
			[StatType.CHARGED_RELOAD_TIME, 1200],
			[StatType.CHARGED_PROJECTILE_ACCEL, 1.8],
			[StatType.CHARGED_PROJECTILE_SPEED, 0.1],
			[StatType.CHARGED_PROJECTILE_TTL, 650],
			[StatType.FIRE_TIME, 500],
			[StatType.FORCE, 0.75],
			[StatType.PROJECTILE_ACCEL, 1.5],
			[StatType.PROJECTILE_SPEED, 0.25],
			[StatType.PROJECTILE_TTL, 500],
			[StatType.RELOAD_TIME, 1000],
		])],
		[EntityType.GATLING, new Map([
			// TODO: fill out recoil values
			[StatType.BURSTS, 25],
			[StatType.FIRE_TIME, 83],
			[StatType.HORIZONTAL_RECOIL, 0],
			[StatType.PROJECTILE_SPEED, 0.8],
			[StatType.PROJECTILE_TTL, 450],
			[StatType.RELOAD_TIME, 600],
			[StatType.REV_TIME, 360],
			[StatType.VERTICAL_RECOIL, 0],
		])],
		[EntityType.GOLDEN_GUN, new Map([
			[StatType.BURSTS, 1],
			[StatType.FIRE_TIME, 140],
			[StatType.PROJECTILE_SPEED, 1],
			[StatType.PROJECTILE_TTL, 400],
			[StatType.RELOAD_TIME, 1400],
		])],
		[EntityType.PISTOL, new Map([
			[StatType.BURSTS, 3],
			[StatType.CHARGED_BURSTS, 6],
			[StatType.CHARGED_FIRE_TIME, 80],
			[StatType.CHARGED_FORCE, 0.2],
			[StatType.CHARGED_RELOAD_TIME, 1000],
			[StatType.CHARGED_PROJECTILE_SPEED, 0.9],
			[StatType.CHARGED_PROJECTILE_TTL, 550],
			[StatType.FIRE_TIME, 160],
			[StatType.PROJECTILE_SPEED, 0.85],
			[StatType.PROJECTILE_TTL, 450],
			[StatType.RELOAD_TIME, 900],
		])],
		[EntityType.PURPLE_GLOVE, new Map([
			[StatType.BURSTS, 4],
			[StatType.FIRE_TIME, 150],
			[StatType.PROJECTILE_SPEED, 0.75],
			[StatType.PROJECTILE_TTL, 1000],
			[StatType.RELOAD_TIME, 750],
		])],
		[EntityType.RED_GLOVE, new Map([
			[StatType.BURSTS, 2],
			[StatType.FIRE_TIME, 125],
			[StatType.PROJECTILE_SPEED, 0.85],
			[StatType.PROJECTILE_TTL, 550],
			[StatType.RELOAD_TIME, 550],
		])],
		[EntityType.SHOTGUN, new Map([
			[StatType.BURSTS, 2],
			[StatType.BURST_BULLETS, 4],
			[StatType.FIRE_TIME, 220],
			[StatType.FORCE, 0.5],
			[StatType.PROJECTILE_SPEED, 0.65],
			[StatType.PROJECTILE_TTL, 440],
			[StatType.RELOAD_TIME, 1100],
			[StatType.SPREAD, 22],
		])],
		[EntityType.SNIPER, new Map([
			[StatType.BURSTS, 3],
			[StatType.CHARGED_BURSTS, 1],
			[StatType.CHARGED_FIRE_TIME, 70],
			[StatType.CHARGED_RELOAD_TIME, 500],
			[StatType.CHARGED_PROJECTILE_SPEED, 1.1],
			[StatType.CHARGED_PROJECTILE_TTL, 450],
			[StatType.FIRE_TIME, 70],
			[StatType.PROJECTILE_SPEED, 0.8],
			[StatType.PROJECTILE_TTL, 450],
			[StatType.RELOAD_TIME, 350],
		])],
		[EntityType.WING_CANNON, new Map([
			[StatType.BURSTS, 5],
			[StatType.CHARGED_BURSTS, 1],
			[StatType.CHARGED_FIRE_TIME, 1000],
			[StatType.CHARGED_RELOAD_TIME, 800],
			[StatType.CHARGED_PROJECTILE_SPEED, 0],
			[StatType.CHARGED_PROJECTILE_TTL, 750],
			[StatType.CHARGED_FORCE, 0.5],
			[StatType.FIRE_TIME, 100],
			[StatType.FORCE, 0.1],
			[StatType.PROJECTILE_SPEED, 0.8],
			[StatType.PROJECTILE_TTL, 400],
			[StatType.RELOAD_TIME, 1200],
		])],

		// Projectile
		[EntityType.BOLT, new Map([
			[StatType.DAMAGE, 15],
			[StatType.CHARGED_DAMAGE, 75],
		])],
		[EntityType.BULLET, new Map([
			[StatType.DAMAGE, 20],
		])],
		[EntityType.CALIBER, new Map([
			[StatType.DAMAGE, 10],
		])],
		[EntityType.GOLDEN_BULLET, new Map([
			[StatType.DAMAGE, 300],
		])],
		[EntityType.KNIFE, new Map([
			[StatType.DAMAGE, 20],
		])],
		[EntityType.LASER, new Map([
			[StatType.DAMAGE, 60],
		])],
		[EntityType.MEGA_ROCKET, new Map([
			[StatType.DAMAGE, 100],
		])],
		[EntityType.ORB, new Map([
			[StatType.DAMAGE, 20],
		])],
		[EntityType.PELLET, new Map([
			[StatType.DAMAGE, 15],
		])],
		[EntityType.ROCKET, new Map([
			[StatType.DAMAGE, 50],
		])],
		[EntityType.STAR, new Map([
			[StatType.DAMAGE, 5],
			[StatType.UNSTICK_DAMAGE, 20],
		])],
	])

	export function has(entityType : EntityType, statType : StatType) : boolean {
		return entityStats.has(entityType) && entityStats.get(entityType).has(statType);
	}
	export function base(entityType : EntityType, statType : StatType) : number {
		if (!entityStats.has(entityType)) {
			console.error("Warning: entity %s has no stats", EntityType[entityType]);
			return 0;
		}
		const stats = entityStats.get(entityType);
		if (!stats.has(statType)) {
			console.error("Warning: entity %s is missing stat %s", EntityType[entityType], StatType[statType]);
			return 0;
		}
		return stats.get(statType);
	}
}
