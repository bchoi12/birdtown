
import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { Buffs } from 'game/component/buffs'
import { AssassinBuff } from 'game/component/buff/assassin_buff'
import { BigBuff } from 'game/component/buff/big_buff'
import { BlackHeadbandBuff } from 'game/component/buff/black_headband_buff'
import { BlasterBuff } from 'game/component/buff/blaster_buff'
import { BruiserBuff } from 'game/component/buff/bruiser_buff'
import { CoolBuff } from 'game/component/buff/cool_buff'
import { DodgyBuff } from 'game/component/buff/dodgy_buff'
import { CarryBuff } from 'game/component/buff/carry_buff'
import { ExplosionBuff } from 'game/component/buff/explosion_buff'
import { ExposeBuff } from 'game/component/buff/expose_buff'
import { FieryBuff } from 'game/component/buff/fiery_buff'
import { FlameBuff } from 'game/component/buff/flame_buff'
import { GlassCannonBuff } from 'game/component/buff/glass_cannon_buff'
import { HealerBuff } from 'game/component/buff/healer_buff'
import { IcyBuff } from 'game/component/buff/icy_buff'
import { ImbueBuff } from 'game/component/buff/imbue_buff'
import { JuicedBuff } from 'game/component/buff/juiced_buff'
import { JumperBuff } from 'game/component/buff/jumper_buff'
import { MosquitoBuff } from 'game/component/buff/mosquito_buff'
import { NightBuff } from 'game/component/buff/night_buff'
import { PoisonBuff } from 'game/component/buff/poison_buff'
import { SlowBuff } from 'game/component/buff/slow_buff'
import { SlyBuff } from 'game/component/buff/sly_buff'
import { SniperBuff } from 'game/component/buff/sniper_buff'
import { SpreeBuff } from 'game/component/buff/spree_buff'
import { SquawkShieldBuff } from 'game/component/buff/squawk_shield_buff'
import { SquawkShotBuff } from 'game/component/buff/squawk_shot_buff'
import { StatStickBuff } from 'game/component/buff/stat_stick_buff'
import { SunBuff } from 'game/component/buff/sun_buff'
import { TankBuff } from 'game/component/buff/tank_buff'
import { VipBuff } from 'game/component/buff/vip_buff'
import { WarmogsBuff } from 'game/component/buff/warmogs_buff'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { BuffType, ColorType } from 'game/factory/api'
import { EquipFactory } from 'game/factory/equip_factory'

import { SeededRandom } from 'util/seeded_random'

export namespace BuffFactory {

	// TODO: exodia buffs + weapon
	// meditation?
	// PERIL_DAMAGE_BOOST
	// BUFFS THAT PROCESS DAMAGE

	const starterMetadata : BuffOptions = {
		maxLevel: 4,
		levelUp: true,
	};
	const basicMetadata = {
		maxLevel: 1,
	}
	const upgradeMetadata = {
		maxLevel: 2,
	};
	const specialMetadata = {
		maxLevel: 3,
	};
	const statusMetadata : BuffOptions = {
		maxLevel: 1,
		resetOnSpawn: true,
	}
	const stackingMetadata : BuffOptions = {
		maxLevel: 6,
		resetOnSpawn: true,
	};

	const percentMetadata : BuffOptions = {
		maxLevel: 100,
		resetOnSpawn: true,
	}

	const metadata = new Map<BuffType, BuffOptions>([
		[BuffType.ASSASSIN, starterMetadata],
		[BuffType.BIG, starterMetadata],
		[BuffType.CARRY, starterMetadata],

		[BuffType.EXPLOSION, basicMetadata],
		[BuffType.JUMPER, basicMetadata],

		[BuffType.BRUISER, upgradeMetadata],
		[BuffType.GLASS_CANNON, upgradeMetadata],

		[BuffType.FIERY, upgradeMetadata],
		[BuffType.ICY, upgradeMetadata],

		[BuffType.SUN, upgradeMetadata],
		[BuffType.NIGHT, upgradeMetadata],

		[BuffType.BLASTER, upgradeMetadata],
		[BuffType.SNIPER, upgradeMetadata],

		[BuffType.SQUAWK_SHOT, upgradeMetadata],
		[BuffType.SQUAWK_SHIELD, upgradeMetadata],

		[BuffType.MOSQUITO, upgradeMetadata],
		[BuffType.TANK, upgradeMetadata],

		[BuffType.HEALER, specialMetadata],
		[BuffType.SLY, specialMetadata],

		[BuffType.COOL, specialMetadata],
		[BuffType.DODGY, specialMetadata],
		[BuffType.JUICED, specialMetadata],

		[BuffType.STAT_STICK, { maxLevel: 300 }],

		// Unused
		[BuffType.WARMOGS, upgradeMetadata],

		[BuffType.EXPOSE, percentMetadata],
		[BuffType.FLAME, stackingMetadata],
		[BuffType.IMBUE, stackingMetadata],
		[BuffType.POISON, stackingMetadata],
		[BuffType.SLOW, stackingMetadata],

		[BuffType.BLACK_HEADBAND, statusMetadata],
		[BuffType.VIP, statusMetadata],
		[BuffType.SPREE, {maxLevel: 3, resetOnSpawn: true }],
	]);

	export const colors = new Map<BuffType, ColorType>([
		[BuffType.IMBUE, ColorType.PARTICLE_YELLOW],
		[BuffType.POISON, ColorType.PARTICLE_GREEN],
		[BuffType.FLAME, ColorType.PARTICLE_RED],
		[BuffType.SLOW, ColorType.PARTICLE_BLUE],
	]);

	export function maxLevel(type : BuffType) : number { return metadata.get(type).maxLevel; }

	const createFns = new Map<BuffType, (type : BuffType) => Buff>([
		[BuffType.ASSASSIN, (type : BuffType) => { return new AssassinBuff(type, metadata.get(type)) }],
		[BuffType.BIG, (type : BuffType) => { return new BigBuff(type, metadata.get(type)) }],
		[BuffType.CARRY, (type : BuffType) => { return new CarryBuff(type, metadata.get(type)) }],

		[BuffType.BLASTER, (type : BuffType) => { return new BlasterBuff(type, metadata.get(type))}],
		[BuffType.BRUISER, (type : BuffType) => { return new BruiserBuff(type, metadata.get(type))}],
		[BuffType.COOL, (type : BuffType) => { return new CoolBuff(type, metadata.get(type))}],
		[BuffType.SLY, (type : BuffType) => { return new SlyBuff(type, metadata.get(type)) }],
		[BuffType.DODGY, (type : BuffType) => { return new DodgyBuff(type, metadata.get(type)) }],
		[BuffType.EXPLOSION, (type : BuffType) => { return new ExplosionBuff(type, metadata.get(type)) }],
		[BuffType.FIERY, (type : BuffType) => { return new FieryBuff(type, metadata.get(type)) }],
		[BuffType.GLASS_CANNON, (type : BuffType) => { return new GlassCannonBuff(type, metadata.get(type)) }],
		[BuffType.HEALER, (type : BuffType) => { return new HealerBuff(type, metadata.get(type)) }],
		[BuffType.ICY, (type : BuffType) => { return new IcyBuff(type, metadata.get(type)) }],
		[BuffType.JUICED, (type : BuffType) => { return new JuicedBuff(type, metadata.get(type)) }],
		[BuffType.JUMPER, (type : BuffType) => { return new JumperBuff(type, metadata.get(type)) }],
		[BuffType.MOSQUITO, (type : BuffType) => { return new MosquitoBuff(type, metadata.get(type)) }],
		[BuffType.SNIPER, (type : BuffType) => { return new SniperBuff(type, metadata.get(type)) }],
		[BuffType.SQUAWK_SHIELD, (type : BuffType) => { return new SquawkShieldBuff(type, metadata.get(type)) }],
		[BuffType.SQUAWK_SHOT, (type : BuffType) => { return new SquawkShotBuff(type, metadata.get(type)) }],
		[BuffType.STAT_STICK, (type : BuffType) => { return new StatStickBuff(type, metadata.get(type)) }],
		[BuffType.SUN, (type : BuffType) => { return new SunBuff(type, metadata.get(type)) }],
		[BuffType.TANK, (type : BuffType) => { return new TankBuff(type, metadata.get(type)) }],
		[BuffType.NIGHT, (type : BuffType) => { return new NightBuff(type, metadata.get(type)) }],
		[BuffType.WARMOGS, (type : BuffType) => { return new WarmogsBuff(type, metadata.get(type)) }],

		[BuffType.BLACK_HEADBAND, (type : BuffType) => { return new BlackHeadbandBuff(type, metadata.get(type)) }],
		[BuffType.SPREE, (type : BuffType) => { return new SpreeBuff(type, metadata.get(type))}],
		[BuffType.VIP, (type : BuffType) => { return new VipBuff(type, metadata.get(type))}],

		[BuffType.EXPOSE, (type : BuffType) => { return new ExposeBuff(type, metadata.get(type)) }],
		[BuffType.FLAME, (type : BuffType) => { return new FlameBuff(type, metadata.get(type)) }],
		[BuffType.IMBUE, (type : BuffType) => { return new ImbueBuff(type, metadata.get(type)) }],
		[BuffType.POISON, (type : BuffType) => { return new PoisonBuff(type, metadata.get(type)) }],
		[BuffType.SLOW, (type : BuffType) => { return new SlowBuff(type, metadata.get(type)) }],
	]);

	export function create<T extends Buff>(type : BuffType) : T {
		if (!createFns.has(type)) {
			console.error("Error: missing factory fn for", BuffType[type]);
			return null;
		}
		return <T>createFns.get(type)(type);
	}

	let buffRandom = new SeededRandom(Math.floor(10000 * Math.random()));
	export function seed(seed : number) : void { buffRandom.seed(seed); }

	const starterBuffs = new Array<BuffType>(BuffType.ASSASSIN, BuffType.BIG, BuffType.CARRY);
	export function getStarters() : Array<BuffType> {
		return starterBuffs;
	}
	export function randomStarter() : BuffType {
		return buffRandom.pick<BuffType>(starterBuffs);
	}
	export function isStarter(type : BuffType) : boolean {
		return starterBuffs.includes(type);
	}

	const generalBuffs = new Array<BuffType>(
		BuffType.COOL,
		BuffType.JUMPER);
	function getGeneralBuffs(player : Player) : Set<BuffType> {
		if (!player.hasComponent(ComponentType.BUFFS)) {
			console.error("Error: %s does not have buff component", player.name());
			return new Set();
		}

		const buffs = player.getComponent<Buffs>(ComponentType.BUFFS);

		let pickableBuffs = new Set<BuffType>();
		generalBuffs.forEach((buff : BuffType) => {
			if (buffs.canBuff(buff) && hasPrereq(player, buff)) {
				pickableBuffs.add(buff);
			}
		});
		return pickableBuffs;
	}

	// Equips with flips
	const dodgeEquips = new Set<EntityType>([
		EntityType.COWBOY_HAT,
		EntityType.RED_HEADBAND,
		EntityType.TOP_HAT,
	]);
	const explodeWeapons = new Set<EntityType>([
		EntityType.BAZOOKA,
		EntityType.ORB_CANNON,
		EntityType.PURPLE_GLOVE,
		EntityType.WING_CANNON,
	]);

	const prereqs = new Map<BuffType, Array<BuffType>>([
		[BuffType.MOSQUITO, [BuffType.ASSASSIN, BuffType.CARRY]],
		[BuffType.TANK, [BuffType.BIG]],
		[BuffType.GLASS_CANNON, [BuffType.ASSASSIN, BuffType.CARRY]],
		[BuffType.BRUISER, [BuffType.ASSASSIN, BuffType.BIG]],
	]);
	export function hasPrereq(player : Player, type : BuffType) : boolean {
		if (!prereqs.has(type)) {
			return true;
		}
		const buffs = prereqs.get(type);
		for (let i = 0; i < buffs.length; ++i) {
			if (player.hasBuff(buffs[i])) {
				return true;
			}
		}
		return false;
	}
	export function getBuffs() : Array<BuffType> {
		return getBuffsForPlayer(game.playerState().targetEntity<Player>());
	}
	export function getBuffsForPlayer(player : Player) : Array<BuffType> {
		let pickableBuffs = getGeneralBuffs(player);

		pickableBuffs.add(chooseBuffs(player, [BuffType.MOSQUITO, BuffType.TANK]));
		pickableBuffs.add(chooseBuffs(player, [BuffType.GLASS_CANNON, BuffType.BRUISER]));
		pickableBuffs.add(chooseBuffs(player, [BuffType.SUN, BuffType.NIGHT]));
		pickableBuffs.add(chooseBuffs(player, [BuffType.ICY, BuffType.FIERY]));
		pickableBuffs.add(chooseBuffs(player, [BuffType.BLASTER, BuffType.SNIPER]));

		// TODO: add squawk shield
		pickableBuffs.add(chooseBuffs(player, [BuffType.SQUAWK_SHOT, BuffType.SQUAWK_SHIELD]));

		if (!EquipFactory.invalidAlts(player.equipType()).includes(EntityType.SCOUTER)) {
			pickableBuffs.add(BuffType.JUICED);
		}
		if (dodgeEquips.has(player.altEquipType())) {
			pickableBuffs.add(BuffType.DODGY);
		}
		if (explodeWeapons.has(player.equipType())) {
			pickableBuffs.add(BuffType.EXPLOSION);
		}
		if (game.controller().isTeamMode()) {
			pickableBuffs.add(chooseBuffs(player, [BuffType.HEALER, BuffType.SLY]));
		} else {
			pickableBuffs.add(BuffType.SLY);
		}

		pickableBuffs.delete(BuffType.UNKNOWN);
		pickableBuffs.forEach((buff : BuffType) => {
			if (player.hasMaxedBuff(buff)) {
				pickableBuffs.delete(buff);
			}
		});

		return Array.from(pickableBuffs);
	}
	export function chooseBuffs(player : Player, buffs : Array<BuffType>) : BuffType {
		let validBuffs = [];
		for (let i = 0; i < buffs.length; ++i) {
			if (!hasPrereq(player, buffs[i])) {
				continue;
			}

			if (player.hasBuff(buffs[i])) {
				if (player.hasMaxedBuff(buffs[i])) {
					return BuffType.UNKNOWN;
				}
				return buffs[i];
			}

			validBuffs.push(buffs[i]);
		}

		if (validBuffs.length === 0) {
			return BuffType.UNKNOWN;
		}

		return buffRandom.pick<BuffType>(validBuffs);
	}
	export function getBuffsN(n : number) : Array<BuffType> {
		let pickableBuffs = getBuffs();

		while (pickableBuffs.length < n) {
			pickableBuffs.push(BuffType.STAT_STICK);
		}

		return buffRandom.shuffle(pickableBuffs, n);
	}
	export function randomBuff() : BuffType {
		return getBuffsN(1)[0];
	}

}
