
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Buff } from 'game/component/buff'
import { Entity } from 'game/entity'
import { BuffType, StatType } from 'game/factory/api'
import { BuffFactory } from 'game/factory/buff_factory'

export class Buffs extends ComponentBase implements Component {

	private _boostCache : Map<StatType, number>;
	private _conditionalBuffs : Map<StatType, Set<BuffType>>;

	constructor() {
		super(ComponentType.BUFFS);

		this._boostCache = new Map();
		this._conditionalBuffs = new Map();

		this.setFactoryFn((id : number) => { return this.registerBuff(id); });
	}

	private registerBuff<T extends Buff>(type : BuffType) : Buff {
		if (!this.hasSubComponent(type)) {
			this.registerSubComponent(type, BuffFactory.create(type));
		}
		return this.buff(type);
	}

	onRespawn() : void {
		this.execute<Buff>((buff : Buff, type : BuffType) => {
			buff.announceLevel();

			if (buff.resetOnSpawn()) {
				this.removeBuff(type);
			}
		});
	}

	levelUp() : void {
		this.execute<Buff>((buff : Buff, type : BuffType) => {
			buff.levelUp();
		});
	}
	addBuff<T extends Buff>(type : BuffType, delta : number) : void {
		if (type === null || type === undefined || type === 0) {
			console.error("Warning: invalid BuffType", type);
			return;
		}

		let buff = this.registerBuff(type);

		if (delta !== 0) {
			if (buff.level() === 0) {
				this.updateConditionals(buff);
			}
			buff.addLevel(delta);
		}
	}
	setBuffMin<T extends Buff>(type : BuffType, min : number) : void {
		let buff = this.registerBuff(type);

		if (buff.level() < min) {
			if (buff.level() === 0) {
				this.updateConditionals(buff);
			}
			buff.setLevel(min);
		}
	}
	hasBuff(type : BuffType) : boolean {
		return this.hasSubComponent(type) && this.getSubComponent<Buff>(type).level() > 0;
	}
	canBuff(type : BuffType) : boolean { return !this.hasBuff(type) || !this.hasMaxedBuff(type); }
	hasMaxedBuff(type : BuffType) : boolean {
		return this.hasBuff(type) && this.buff(type).atMaxLevel();
	}
	buffLevel(type : BuffType) : number {
		return this.hasBuff(type) ? this.buff(type).level() : 0;
	}
	removeBuff(type : BuffType) : void {
		if (!this.hasBuff(type)) {
			return;
		}

		let buff = this.buff(type);
		if (buff.level() > 0) {
			this.updateConditionals(buff);
			buff.setLevel(0);
		}
	}
	clearBuffs() : void {
		this.execute<Buff>((buff : Buff, type : BuffType) => {
			this.removeBuff(type);
		});
		this._boostCache.clear();
	}
	private buff<T extends Buff>(type : BuffType) : T {
		if (!this.hasSubComponent(type)) {
			console.error("Error: accessing non-existent buff", BuffType[type]);
		}
		return this.getSubComponent<T>(type);
	}

	boostCache() : Map<StatType, number> { return this._boostCache; }
	getBoost(type : StatType) : number {
		const boost = this._boostCache.has(type) ? this._boostCache.get(type) : 0;
		let conditional = 0;
		if (this._conditionalBuffs.has(type)) {
			this._conditionalBuffs.get(type).forEach((buffType : BuffType) => {
				conditional += this.buff(buffType).conditionalBoost(type);
			});
		}
		return boost + conditional;
	}
	private updateConditionals(buff : Buff) : void {
		const conditionals = buff.conditionalStats();
		if (conditionals.size === 0) {
			return;
		}

		if (buff.level() <= 0) {
			conditionals.forEach((type : StatType) => {
				if (this._conditionalBuffs.has(type)) {
					this._conditionalBuffs.get(type).delete(buff.buffType());
				}
			});
			return;
		}

		conditionals.forEach((type : StatType) => {
			if (this._conditionalBuffs.has(type)) {
				this._conditionalBuffs.get(type).add(buff.buffType());
			}
		});
	}
}