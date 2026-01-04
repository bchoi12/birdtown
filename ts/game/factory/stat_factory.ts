
import { game } from 'game'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { StatType } from 'game/factory/api'

export namespace StatFactory {

	const baseStats = new Map<StatType, number>([
		[StatType.BURST_BONUS, 0],
		[StatType.BURST_BOOST, 0],
		[StatType.CHARGE_BOOST, 0],
		[StatType.CRIT_CHANCE, 0],
		[StatType.CRIT_BOOST, 0],
		[StatType.DAMAGE_ADDITION, 0],
		[StatType.DAMAGE_BOOST, 0],
		[StatType.DAMAGE_CLOSE_BOOST, 0],
		[StatType.DAMAGE_FAR_BOOST, 0],
		[StatType.DAMAGE_TAKEN_BOOST, 0],
		[StatType.DAMAGE_REDUCTION, 0],
		[StatType.DAMAGE_RESIST_BOOST, 0],
		[StatType.EXPLOSION_BOOST, 0],
		[StatType.EXPLOSION_DAMAGE, 0],
		[StatType.FIRE_BOOST, 0],
		[StatType.HEALTH_ADDITION, 0],
		[StatType.HEAL_PERCENT, 0],
		[StatType.HEALTH_BOOST, 0],
		[StatType.HP_REGEN, 0],
		[StatType.PROJECTILE_SCALING_BOOST, 0],
		[StatType.RELOAD_BOOST, 0],
		[StatType.REV_BOOST, 0],
		[StatType.REVIVE_BOOST, 0],
		[StatType.SCALING, 1],
		[StatType.SPEED_BOOST, 0],
		[StatType.SPEED_DEBUFF, 0],
		[StatType.USE_BOOST, 0],
	]);

	const statMin = new Map<StatType, number>([
		[StatType.PROJECTILE_SCALING_BOOST, 0],
		[StatType.SCALING, 0.3],
	]);

	const statMax = new Map<StatType, number>([
		[StatType.SCALING, 2.7],
	]);

	const entityStats = new Map<EntityType, Map<StatType, number>>([
		[EntityType.PLAYER, new Map([
			[StatType.AIR_SPEED_BOOST, 0],
			[StatType.CRIT_BOOST, 0.5],
			[StatType.DOUBLE_JUMPS, 1],
			[StatType.EXPOSE_PERCENT, 0],
			[StatType.FLAME_CHANCE, 0],
			[StatType.HEALTH, 100],
			[StatType.HP_REGEN_DELAY, 5000],
			[StatType.IMBUE_LEVEL, 0],
			[StatType.LIFE_STEAL, 0],
			[StatType.POISON_CHANCE, 0],
			[StatType.SHIELD, 0],
			[StatType.SHIELD_STEAL, 0],
			[StatType.SLOW_CHANCE, 0],
			[StatType.SCALING, 1],
		])],

		// Other Entities
		[EntityType.BUFF_CRATE, new Map([
			[StatType.HEALTH, 40],
		])],
		[EntityType.HEALTH_CRATE, new Map([
			[StatType.HEALTH, 40],
		])],
		[EntityType.WEAPON_CRATE, new Map([
			[StatType.HEALTH, 40],
		])],
		[EntityType.UNDERWATER_ROCK, new Map([
			[StatType.HEALTH, 100],
		])],

		// Equips
		[EntityType.BEAK, new Map([
			[StatType.CHARGE_RATE, 40],
			[StatType.CHARGED_PROJECTILE_ACCEL, 0],
			[StatType.CHARGED_PROJECTILE_SPEED, 1],
			[StatType.CHARGED_PROJECTILE_TTL, 400],
			[StatType.PROJECTILE_ACCEL, 1.5],
			[StatType.PROJECTILE_SPEED, 0.2],
			[StatType.PROJECTILE_TTL, 550],
		])],
		[EntityType.BOOBY_BEAK, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.USE_JUICE, 33],
		])],
		[EntityType.CARDINAL_BEAK, new Map([
			[StatType.CHARGE_DELAY, 500],
			[StatType.USE_JUICE, 50],
		])],
		[EntityType.CHICKEN_BEAK, new Map([
			[StatType.CHARGE_DELAY, 500],
			[StatType.USE_JUICE, 50],
		])],
		[EntityType.DUCK_BEAK, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.USE_JUICE, 33],
		])],
		[EntityType.EAGLE_BEAK, new Map([
			[StatType.CHARGE_DELAY, 1200],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.FLAMINGO_BEAK, new Map([
			[StatType.CHARGE_DELAY, 500],
			[StatType.USE_JUICE, 50],
		])],
		[EntityType.GOOSE_BEAK, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.USE_JUICE, 33],
		])],
		[EntityType.PIGEON_BEAK, new Map([
			[StatType.CHARGE_DELAY, 1200],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.RAVEN_BEAK, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.USE_JUICE, 33],
		])],
		[EntityType.ROBIN_BEAK, new Map([
			[StatType.CHARGE_DELAY, 500],
			[StatType.USE_JUICE, 50],
		])],

		[EntityType.BLACK_HEADBAND, new Map([
			[StatType.CHARGE_DELAY, 60],
			[StatType.CHARGE_RATE, 180],
			[StatType.FORCE, 0.7],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.BOOSTER, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.CHARGE_RATE, 100],
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
			[StatType.CHARGE_DELAY, 300],
			[StatType.CHARGE_RATE, 70],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.JETPACK, new Map([
			[StatType.CHARGE_DELAY, 300],
			[StatType.CHARGE_RATE, 160],
			// Adjusted by time
			[StatType.USE_JUICE, 0.1],
		])],
		[EntityType.POCKET_ROCKET, new Map([
			[StatType.CHARGE_DELAY, 500],
			[StatType.CHARGE_RATE, 30],
			[StatType.PROJECTILE_ACCEL, 1.3],
			[StatType.PROJECTILE_SPEED, 0.1],
			[StatType.PROJECTILE_TTL, 550],
			[StatType.USE_JUICE, 50],
		])],
		[EntityType.MINI_ROCKET, new Map([
			[StatType.DAMAGE, 35],
		])],
		[EntityType.PURPLE_HEADBAND, new Map([
			[StatType.CHARGE_DELAY, 450],
			[StatType.CHARGE_RATE, 80],
			[StatType.FORCE, 0.8],
			[StatType.USE_JUICE, 45],
		])],
		[EntityType.RED_HEADBAND, new Map([
			[StatType.CHARGE_DELAY, 450],
			[StatType.CHARGE_RATE, 200],
			[StatType.FORCE, -0.8],
			[StatType.PROJECTILE_SPEED, 0.85],
			[StatType.PROJECTILE_TTL, 550],
			[StatType.USE_JUICE, 100],
		])],
		[EntityType.TOP_HAT, new Map([
			[StatType.CHARGE_DELAY, 400],
			[StatType.CHARGE_RATE, 250],
			[StatType.FORCE, 0.6],
			[StatType.USE_JUICE, 100],
		])],

		// Weapons
		// 66 DPS + disrupt
		[EntityType.BAZOOKA, new Map([
			[StatType.BURSTS, 1],
			[StatType.CHARGED_BURSTS, 1],
			[StatType.CHARGED_FIRE_TIME, 750],
			[StatType.CHARGED_FORCE, 0.75],
			[StatType.CHARGED_RELOAD_TIME, 900],
			[StatType.CHARGED_PROJECTILE_ACCEL, 1.8],
			[StatType.CHARGED_PROJECTILE_SPEED, 0.3],
			[StatType.CHARGED_PROJECTILE_TTL, 550],
			[StatType.FIRE_TIME, 500],
			[StatType.FORCE, 0.3],
			[StatType.PROJECTILE_ACCEL, 1.5],
			[StatType.PROJECTILE_SPEED, 0.2],
			[StatType.PROJECTILE_TTL, 550],
			[StatType.RELOAD_TIME, 900],
		])],
		[EntityType.ROCKET, new Map([
			[StatType.DAMAGE, 50],
		])],
		[EntityType.MEGA_ROCKET, new Map([
			[StatType.DAMAGE, 95],
		])],
		// 150 DPS + 400 delay
		[EntityType.GATLING, new Map([
			// TODO: fill out recoil values
			[StatType.BURSTS, 16],
			[StatType.CHARGED_BURSTS, 8],
			[StatType.CHARGED_FIRE_TIME, 40],
			[StatType.CHARGED_FORCE, 0],
			[StatType.CHARGED_RELOAD_TIME, 600],
			[StatType.CHARGED_PROJECTILE_SPEED, 1],
			[StatType.CHARGED_PROJECTILE_TTL, 450],
			[StatType.CHARGED_REV_TIME, 0],
			[StatType.FIRE_TIME, 80],
			[StatType.HORIZONTAL_RECOIL, 0],
			[StatType.PROJECTILE_SPEED, 0.8],
			[StatType.PROJECTILE_TTL, 425],
			[StatType.RELOAD_TIME, 600],
			[StatType.REV_TIME, 400],
			[StatType.VERTICAL_RECOIL, 0],
		])],
		[EntityType.CALIBER, new Map([
			[StatType.DAMAGE, 12],
		])],
		// 250 DPS
		[EntityType.GOLDEN_GUN, new Map([
			[StatType.BURSTS, 1],
			[StatType.CHARGED_BURSTS, 3],
			[StatType.CHARGED_FIRE_TIME, 140],
			[StatType.CHARGED_RELOAD_TIME, 1200],
			[StatType.CHARGED_PROJECTILE_SPEED, 1],
			[StatType.CHARGED_PROJECTILE_TTL, 450],
			[StatType.FIRE_TIME, 140],
			[StatType.PROJECTILE_SPEED, 1],
			[StatType.PROJECTILE_TTL, 400],
			[StatType.RELOAD_TIME, 1200],
		])],
		// Always critical
		[EntityType.BEAK_BULLET, new Map([
			[StatType.DAMAGE, 80],
		])],
		[EntityType.GOLDEN_BULLET, new Map([
			[StatType.DAMAGE, 200],
		])],
		// >90 DPS + slight spread
		// 4 shots in 500ms
		[EntityType.MINIGUN, new Map([
			[StatType.BURSTS, 4],
			[StatType.FIRE_TIME, 70],
			[StatType.PROJECTILE_SPEED, 0.85],
			[StatType.PROJECTILE_TTL, 400],
			[StatType.RELOAD_TIME, 200],
			[StatType.SPREAD, 4],
		])],
		// Big DPS + 400 delay + explosions
		[EntityType.ORB_CANNON, new Map([
			// TODO: fill out recoil values
			[StatType.BURSTS, 10],
			[StatType.FIRE_TIME, 100],
			[StatType.HORIZONTAL_RECOIL, 0],
			[StatType.PROJECTILE_SPEED, 0.7],
			[StatType.PROJECTILE_TTL, 425],
			[StatType.RELOAD_TIME, 600],
			[StatType.REV_TIME, 400],
			[StatType.VERTICAL_RECOIL, 0],
		])],
		[EntityType.MINI_ORB, new Map([
			[StatType.DAMAGE, 20],
		])],
		// 58 DPS + threshold
		// 3 shots in 1200ms
		[EntityType.PISTOL, new Map([
			[StatType.BURSTS, 3],
			[StatType.CHARGED_BURSTS, 6],
			[StatType.CHARGED_FIRE_TIME, 90],
			[StatType.CHARGED_FORCE, 0.2],
			[StatType.CHARGED_RELOAD_TIME, 925],
			[StatType.CHARGED_PROJECTILE_SPEED, 0.9],
			[StatType.CHARGED_PROJECTILE_TTL, 550],
			[StatType.FIRE_TIME, 150],
			[StatType.PROJECTILE_SPEED, 0.85],
			[StatType.PROJECTILE_TTL, 425],
			[StatType.RELOAD_TIME, 925],
		])],
		[EntityType.BULLET, new Map([
			[StatType.DAMAGE, 25],
		])],
		// 83 DPS + delay damage
		// 4 shots in 1200ms
		[EntityType.PURPLE_GLOVE, new Map([
			[StatType.BURSTS, 4],
			[StatType.FIRE_TIME, 150],
			[StatType.PROJECTILE_SPEED, 0.75],
			[StatType.PROJECTILE_TTL, 1000],
			[StatType.RELOAD_TIME, 600],
		])],
		[EntityType.STAR, new Map([
			[StatType.DAMAGE, 5],
			[StatType.UNSTICK_DAMAGE, 20],
		])],
		// 60 DPS + equip knife
		// 2 shots in 675ms
		[EntityType.RED_GLOVE, new Map([
			[StatType.BURSTS, 2],
			[StatType.FIRE_TIME, 110],
			[StatType.PROJECTILE_SPEED, 0.85],
			[StatType.PROJECTILE_TTL, 550],
			[StatType.RELOAD_TIME, 400],
		])],
		[EntityType.KNIFE, new Map([
			[StatType.DAMAGE, 20],
		])],
		[EntityType.POISONING_KNIFE, new Map([
			[StatType.DAMAGE, 20],
		])],
		// 63 DPS + fast bullet + partial clip
		[EntityType.RIFLE, new Map([
			[StatType.BURSTS, 8],
			[StatType.CHARGED_BURSTS, 8],
			[StatType.CHARGED_FIRE_TIME, 200],
			[StatType.CHARGED_FORCE, 0.1],
			[StatType.CHARGED_PROJECTILE_SPEED, 1.1],
			[StatType.CHARGED_PROJECTILE_TTL, 475],
			[StatType.CHARGED_RELOAD_TIME, 1200],
			[StatType.FIRE_TIME, 350],
			[StatType.FORCE, 0],
			[StatType.PROJECTILE_SPEED, 1],
			[StatType.PROJECTILE_TTL, 375],
			[StatType.RELOAD_TIME, 1200],
		])],
		[EntityType.CARTRIDGE, new Map([
			[StatType.DAMAGE, 30],
		])],
		[EntityType.PIERCER, new Map([
			[StatType.DAMAGE, 40],
		])],
		// 90 DPS + short range + spread + oneshot
		// 2 shots in 1420ms
		[EntityType.SHOTGUN, new Map([
			[StatType.BURSTS, 2],
			[StatType.BURST_BULLETS, 4],
			[StatType.FIRE_TIME, 220],
			[StatType.FORCE, 0.5],
			[StatType.PROJECTILE_SPEED, 0.65],
			[StatType.PROJECTILE_TTL, 360],
			[StatType.RELOAD_TIME, 900],
			[StatType.SPREAD, 23],
		])],
		[EntityType.PELLET, new Map([
			[StatType.DAMAGE, 15],
		])],
		// 80 DPS
		[EntityType.LASER_CANNON, new Map([
			[StatType.BURSTS, 2],
			[StatType.CHARGED_BURSTS, 2],
			[StatType.CHARGED_FIRE_TIME, 500],
			[StatType.CHARGED_RELOAD_TIME, 900],
			[StatType.CHARGED_PROJECTILE_SPEED, 0],
			[StatType.CHARGED_PROJECTILE_TTL, 750],
			[StatType.CHARGED_FORCE, 0],
			[StatType.CHARGED_REV_TIME, 0],
			[StatType.FIRE_TIME, 110],
			[StatType.FORCE, 0],
			[StatType.PROJECTILE_SPEED, 0.9],
			[StatType.PROJECTILE_TTL, 375],
			[StatType.RELOAD_TIME, 500],
			[StatType.REV_TIME, 400],
		])],
		[EntityType.PURPLE_BOLT, new Map([
			[StatType.DAMAGE, 40],
		])],
		[EntityType.PURPLE_LASER, new Map([
			[StatType.DAMAGE, 45],
		])],
		// 75 DPS
		// 3 shots in 600ms
		[EntityType.LASER_GUN, new Map([
			[StatType.BURSTS, 3],
			[StatType.CHARGED_BURSTS, 1],
			[StatType.CHARGED_FIRE_TIME, 400],
			[StatType.CHARGED_RELOAD_TIME, 400],
			[StatType.CHARGED_PROJECTILE_SPEED, 1.1],
			[StatType.CHARGED_PROJECTILE_TTL, 500],
			[StatType.FIRE_TIME, 75],
			[StatType.PROJECTILE_SPEED, 0.8],
			[StatType.PROJECTILE_TTL, 425],
			[StatType.RELOAD_TIME, 400],
		])],
		[EntityType.BOLT, new Map([
			[StatType.DAMAGE, 15],
		])],
		[EntityType.CHARGED_BOLT, new Map([
			// Always critical (1.5x)
			[StatType.DAMAGE, 50],
		])],
		// 78 DPS + disrupt + hard aim + burst
		// 5 shots in 1600ms
		[EntityType.WING_CANNON, new Map([
			[StatType.BURSTS, 5],
			[StatType.CHARGED_BURSTS, 1],
			[StatType.CHARGED_FIRE_TIME, 700],
			[StatType.CHARGED_RELOAD_TIME, 1200],
			[StatType.CHARGED_PROJECTILE_SPEED, 0],
			[StatType.CHARGED_PROJECTILE_TTL, 750],
			[StatType.CHARGED_FORCE, 0],
			[StatType.FIRE_TIME, 100],
			[StatType.FORCE, 0.1],
			[StatType.PROJECTILE_SPEED, 0.8],
			[StatType.PROJECTILE_TTL, 400],
			[StatType.RELOAD_TIME, 1200],
		])],
		[EntityType.ORB, new Map([
			[StatType.DAMAGE, 25],
		])],
		[EntityType.LASER, new Map([
			[StatType.DAMAGE, 60],
		])],
	])

	function hasType(entityType : EntityType, statType : StatType) : boolean {
		return entityStats.has(entityType) && entityStats.get(entityType).has(statType);
	}
	export function has(entity : Entity, statType : StatType) : boolean {
		const entityType = entity.type();
		const parentType = entity.parentType();

		return baseStats.has(statType) || hasType(entityType, statType) || hasType(parentType, statType);
	}
	export function base(entity : Entity, statType : StatType) : number {
		if (!has(entity, statType)) {
			console.error("Warning: entity %s (parent: %s) is missing %s", entity.name(), EntityType[entity.parentType()], StatType[statType]);
			return 0;
		}

		const entityType = entity.type();
		if (hasType(entityType, statType)) {
			return entityStats.get(entityType).get(statType);
		}

		const parentType = entity.parentType();
		if (hasType(parentType, statType)) {
			return entityStats.get(parentType).get(statType);
		}

		if (baseStats.has(statType)) {
			return baseStats.get(statType);
		}

		console.error("Warning: no valid stat entries found for %s, %s", entity.name(), StatType[statType]);
		return 0;
	}
	export function clamp(type : StatType, value : number) : number {
		if (statMin.has(type)) {
			value = Math.max(value, statMin.get(type));
		}
		if (statMax.has(type)) {
			value = Math.min(value, statMax.get(type));
		}
		return value;
	}
}
