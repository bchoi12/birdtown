
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, BoostType, ModifierType, ModifierPlayerType, StatType } from 'game/component/api'
import { Stats } from 'game/component/stats'
import { Stat } from 'game/component/stat'

import { Entity } from 'game/entity'

import { RingBuffer } from 'util/ring_buffer'
import { defined } from 'util/common'
import { Optional } from 'util/optional'

type ModifierValue = ModifierPlayerType|number;
export type ModifiersInitOptions = {
	modifiers : Map<ModifierType, ModifierValue>;
}

export class Modifiers extends ComponentBase implements Component {

	private static readonly _order : Array<ModifierType> = [
		ModifierType.TYPE,
	];

	private _modifiers : Map<ModifierType, ModifierValue>;

	constructor(init? : ModifiersInitOptions) {
		super(ComponentType.MODIFIERS);

		this.setName({ base: "modifiers" });

		this._modifiers = defined(init) ? init.modifiers : new Map();

		for (const stringModifier in ModifierType) {
			const modifier = Number(ModifierType[stringModifier]);
			if (Number.isNaN(modifier) || modifier <= 0) {
				continue;
			}

			this.registerProp<ModifierValue>(modifier, {
				has: () => { return this.hasModifier(modifier); },
				export: () => { return this.getModifier(modifier); },
				import: (obj : ModifierValue) => { this.setModifier(modifier, obj); },
			})
		}
	}

	hasModifier(type : ModifierType) : boolean { return this._modifiers.has(type); }
	getModifier(type : ModifierType) : ModifierValue { return this._modifiers.get(type); }
	setModifier(type : ModifierType, value : ModifierValue) : void { this._modifiers.set(type, value); }
	deleteModifier(type : ModifierType) : void { this._modifiers.delete(type); }

	applyTo(stats : Stats) : void {
		for (let type of Modifiers._order) {
			if (!this.hasModifier(type)) {
				continue;
			}

			switch (type) {
			case ModifierType.TYPE:
				this.applyType(stats, this.getModifier(type));
				break;
			}
		}
	}

	private applyType(stats : Stats, classType : ModifierPlayerType) : void {
		switch (classType) {
		case ModifierPlayerType.BIG:
			if (!stats.hasStat(StatType.HEALTH)) {
				stats.addStat(StatType.HEALTH);
			}
			let health = stats.getStat(StatType.HEALTH);
			if (health.getMax().has()) {
				health.getMax().get().addBoost(BoostType.ADD_BASE, (value : number) => {
					return value + 25;
				});
			}
			health.getStatNumber().addBoost(BoostType.ADD_BASE, (value : number) => {
				return value + 25;
			});

			if (!stats.hasStat(StatType.SCALING)) {
				stats.addStat(StatType.SCALING, { stat: 1 });
			}
			let scaling = stats.getStat(StatType.SCALING);
			scaling.getStatNumber().addBoost(BoostType.ADD_BASE, (value : number) => {
				return value + 0.4;
			});
			break;
		case ModifierPlayerType.FAST:
			break;
		case ModifierPlayerType.SHARP:
			break;
		}
	}
}