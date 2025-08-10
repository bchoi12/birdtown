
import { game } from 'game'
import { Buff } from 'game/component/buff'
import { AcrobaticBuff } from 'game/component/buff/acrobatic_buff'
import { BigBuff } from 'game/component/buff/big_buff'
import { BlackHeadbandBuff } from 'game/component/buff/black_headband_buff'
import { BlasterBuff } from 'game/component/buff/blaster_buff'
import { CoolBuff } from 'game/component/buff/cool_buff'
import { CritBuff } from 'game/component/buff/crit_buff'
import { DodgyBuff } from 'game/component/buff/dodgy_buff'
import { EagleEyeBuff } from 'game/component/buff/eagle_eye_buff'
import { ExposeBuff } from 'game/component/buff/expose_buff'
import { GlassCannonBuff } from 'game/component/buff/glass_cannon_buff'
import { HealerBuff } from 'game/component/buff/healer_buff'
import { IcyBuff } from 'game/component/buff/icy_buff'
import { JuicedBuff } from 'game/component/buff/juiced_buff'
import { MosquitoBuff } from 'game/component/buff/mosquito_buff'
import { SlowBuff } from 'game/component/buff/slow_buff'
import { SniperBuff } from 'game/component/buff/sniper_buff'
import { StatStickBuff } from 'game/component/buff/stat_stick_buff'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BuffType } from 'game/factory/api'

export namespace BuffFactory {

	const createFns = new Map<BuffType, (type : BuffType) => Buff>([
		[BuffType.ACROBATIC, (type : BuffType) => { return new AcrobaticBuff(type, { maxLevel: 4 }) }],
		[BuffType.BIG, (type : BuffType) => { return new BigBuff(type, { maxLevel: 4 }) }],
		[BuffType.EAGLE_EYE, (type : BuffType) => { return new EagleEyeBuff(type, { maxLevel: 4 }) }],

		[BuffType.BLASTER, (type : BuffType) => { return new BlasterBuff(type, { maxLevel: 3 })}],
		[BuffType.COOL, (type : BuffType) => { return new CoolBuff(type, { maxLevel: 3 })}],
		[BuffType.CRIT, (type : BuffType) => { return new CritBuff(type, { maxLevel: 3 }) }],
		[BuffType.DODGY, (type : BuffType) => { return new DodgyBuff(type, { maxLevel: 3 }) }],
		[BuffType.GLASS_CANNON, (type : BuffType) => { return new GlassCannonBuff(type, { maxLevel: 3 }) }],
		[BuffType.HEALER, (type : BuffType) => { return new HealerBuff(type, { maxLevel: 3 }) }],
		[BuffType.ICY, (type : BuffType) => { return new IcyBuff(type, { maxLevel: 3 }) }],
		[BuffType.JUICED, (type : BuffType) => { return new JuicedBuff(type, { maxLevel: 3 }) }],
		[BuffType.MOSQUITO, (type : BuffType) => { return new MosquitoBuff(type, { maxLevel: 3 }) }],
		[BuffType.SNIPER, (type : BuffType) => { return new SniperBuff(type, { maxLevel: 3 }) }],
		[BuffType.STAT_STICK, (type : BuffType) => { return new StatStickBuff(type, { maxLevel: 100 }) }],

		[BuffType.BLACK_HEADBAND, (type : BuffType) => { return new BlackHeadbandBuff(type, { maxLevel: 1 }) }],

		[BuffType.EXPOSE, (type : BuffType) => { return new ExposeBuff(type, { maxLevel: 20 }) }],
		[BuffType.SLOW, (type : BuffType) => { return new SlowBuff(type, { maxLevel: 25 }) }],
	]);

	export function create<T extends Buff>(type : BuffType) : T {
		if (!createFns.has(type)) {
			console.error("Error: missing factory fn for", BuffType[type]);
			return null;
		}
		return <T>createFns.get(type)(type);
	}

}
