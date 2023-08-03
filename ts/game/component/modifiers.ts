
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, BoostType, ModifierType, ModifierPlayerType, StatType } from 'game/component/api'
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
		ModifierType.CLASS,
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

	apply(statType : StatType, stat : Stat) : void {
		for (let type of Modifiers._order) {
			if (!this.hasModifier(type)) {
				continue;
			}

			switch (type) {
			case ModifierType.CLASS:
				this.applyClass(statType, stat, this.getModifier(type));
				break;
			}
		}
	}

	private applyClass(statType : StatType, stat : Stat, classType : ModifierPlayerType) : void {
		switch (classType) {
		case ModifierPlayerType.BIG:
			switch (statType) {
			case StatType.HEALTH:
				if (stat.getMax().has()) {
					stat.getMax().get().addBoost(BoostType.ADD, (value : number) => {
						return value + 25;
					});
				}
				stat.getStat().addBoost(BoostType.ADD, (value : number) => {
					return value + 25;
				});
				break;
			}
			break;
		case ModifierPlayerType.FAST:
			break;
		case ModifierPlayerType.SHARP:
			break;
		}
	}
}