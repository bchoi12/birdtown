
import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Buff } from 'game/component/buff'
import { Buffs } from 'game/component/buffs'
import { AcrobaticBuff } from 'game/component/buff/acrobatic_buff'
import { BigBuff } from 'game/component/buff/big_buff'
import { BlackHeadbandBuff } from 'game/component/buff/black_headband_buff'
import { BlasterBuff } from 'game/component/buff/blaster_buff'
import { CoolBuff } from 'game/component/buff/cool_buff'
import { CritBuff } from 'game/component/buff/crit_buff'
import { DodgyBuff } from 'game/component/buff/dodgy_buff'
import { EagleEyeBuff } from 'game/component/buff/eagle_eye_buff'
import { ExplosionBuff } from 'game/component/buff/explosion_buff'
import { ExposeBuff } from 'game/component/buff/expose_buff'
import { FieryBuff } from 'game/component/buff/fiery_buff'
import { FlameBuff } from 'game/component/buff/flame_buff'
import { GlassCannonBuff } from 'game/component/buff/glass_cannon_buff'
import { HealerBuff } from 'game/component/buff/healer_buff'
import { IcyBuff } from 'game/component/buff/icy_buff'
import { JuicedBuff } from 'game/component/buff/juiced_buff'
import { JumperBuff } from 'game/component/buff/jumper_buff'
import { MosquitoBuff } from 'game/component/buff/mosquito_buff'
import { SlowBuff } from 'game/component/buff/slow_buff'
import { SniperBuff } from 'game/component/buff/sniper_buff'
import { SpreeBuff } from 'game/component/buff/spree_buff'
import { StatStickBuff } from 'game/component/buff/stat_stick_buff'
import { TankBuff } from 'game/component/buff/tank_buff'
import { VampireBuff } from 'game/component/buff/vampire_buff'
import { WarmogsBuff } from 'game/component/buff/warmogs_buff'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { BuffType } from 'game/factory/api'

import { SeededRandom } from 'util/seeded_random'

export namespace BuffFactory {

	const createFns = new Map<BuffType, (type : BuffType) => Buff>([
		[BuffType.ACROBATIC, (type : BuffType) => { return new AcrobaticBuff(type, { maxLevel: 5 }) }],
		[BuffType.BIG, (type : BuffType) => { return new BigBuff(type, { maxLevel: 5 }) }],
		[BuffType.EAGLE_EYE, (type : BuffType) => { return new EagleEyeBuff(type, { maxLevel: 5 }) }],

		[BuffType.BLASTER, (type : BuffType) => { return new BlasterBuff(type, { maxLevel: 3 })}],
		[BuffType.COOL, (type : BuffType) => { return new CoolBuff(type, { maxLevel: 3 })}],
		[BuffType.CRIT, (type : BuffType) => { return new CritBuff(type, { maxLevel: 3 }) }],
		[BuffType.DODGY, (type : BuffType) => { return new DodgyBuff(type, { maxLevel: 3 }) }],
		[BuffType.EXPLOSION, (type : BuffType) => { return new ExplosionBuff(type, { maxLevel: 3 }) }],
		[BuffType.FIERY, (type : BuffType) => { return new FieryBuff(type, { maxLevel: 3 }) }],
		[BuffType.GLASS_CANNON, (type : BuffType) => { return new GlassCannonBuff(type, { maxLevel: 3 }) }],
		[BuffType.HEALER, (type : BuffType) => { return new HealerBuff(type, { maxLevel: 3 }) }],
		[BuffType.ICY, (type : BuffType) => { return new IcyBuff(type, { maxLevel: 3 }) }],
		[BuffType.JUICED, (type : BuffType) => { return new JuicedBuff(type, { maxLevel: 3 }) }],
		[BuffType.JUMPER, (type : BuffType) => { return new JumperBuff(type, { maxLevel: 3 }) }],
		[BuffType.MOSQUITO, (type : BuffType) => { return new MosquitoBuff(type, { maxLevel: 3 }) }],
		[BuffType.SNIPER, (type : BuffType) => { return new SniperBuff(type, { maxLevel: 3 }) }],
		[BuffType.SPREE, (type : BuffType) => { return new SpreeBuff(type, {maxLevel: 3, resetOnSpawn: true })}],
		[BuffType.STAT_STICK, (type : BuffType) => { return new StatStickBuff(type, { maxLevel: 300 }) }],
		[BuffType.TANK, (type : BuffType) => { return new TankBuff(type, { maxLevel: 3 }) }],
		[BuffType.VAMPIRE, (type : BuffType) => { return new VampireBuff(type, { maxLevel: 3 }) }],
		[BuffType.WARMOGS, (type : BuffType) => { return new WarmogsBuff(type, { maxLevel: 3 }) }],

		[BuffType.BLACK_HEADBAND, (type : BuffType) => { return new BlackHeadbandBuff(type, { maxLevel: 1 }) }],

		[BuffType.EXPOSE, (type : BuffType) => { return new ExposeBuff(type, { maxLevel: 6, resetOnSpawn: true }) }],
		[BuffType.FLAME, (type : BuffType) => { return new FlameBuff(type, { maxLevel: 6, resetOnSpawn: true }) }],
		[BuffType.SLOW, (type : BuffType) => { return new SlowBuff(type, { maxLevel: 6, resetOnSpawn: true }) }],
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

	const starterBuffs = new Array<BuffType>(BuffType.ACROBATIC, BuffType.BIG, BuffType.EAGLE_EYE);
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
		BuffType.BLASTER,
		BuffType.COOL,
		BuffType.CRIT,
		BuffType.FIERY,
		BuffType.GLASS_CANNON,
		BuffType.ICY,
		BuffType.JUMPER,
		BuffType.VAMPIRE,
		BuffType.WARMOGS);
	function getGeneralBuffs(player : Player) : Set<BuffType> {
		if (!player.hasComponent(ComponentType.BUFFS)) {
			console.error("Error: %s does not have buff component", player.name());
			return new Set();
		}

		const buffs = player.getComponent<Buffs>(ComponentType.BUFFS);

		let pickableBuffs = new Set<BuffType>();
		generalBuffs.forEach((buff : BuffType) => {
			if (buffs.canBuff(buff)) {
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
	const prereqBuffs = new Map<BuffType, Array<BuffType>>([
		[BuffType.ACROBATIC, [BuffType.MOSQUITO, BuffType.TANK]],
		[BuffType.BIG, [BuffType.TANK]],
		[BuffType.EAGLE_EYE, [BuffType.MOSQUITO]],
	]);
	// Unused: SNIPER
	export function getBuffs() : Array<BuffType> {
		return getBuffsForPlayer(game.playerState().targetEntity<Player>());
	}
	export function getBuffsForPlayer(player : Player) : Array<BuffType> {
		let pickableBuffs = getGeneralBuffs(player);

		prereqBuffs.forEach((buffs : Array<BuffType>, reqType : BuffType) => {
			if (player.hasBuff(reqType)) {
				buffs.forEach((buff : BuffType) => {
					pickableBuffs.add(buff);
				});
			}
		});

		if (player.altEquipType() === EntityType.SCOUTER) {
			pickableBuffs.add(BuffType.JUICED);
		}
		if (dodgeEquips.has(player.altEquipType())) {
			pickableBuffs.add(BuffType.DODGY);
		}
		if (explodeWeapons.has(player.equipType())) {
			pickableBuffs.add(BuffType.EXPLOSION);
		}
		if (game.controller().isTeamMode()) {
			pickableBuffs.add(BuffType.HEALER);
		}

		pickableBuffs.forEach((buff : BuffType) => {
			if (player.hasMaxedBuff(buff)) {
				pickableBuffs.delete(buff);
			}
		});

		return Array.from(pickableBuffs);
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
