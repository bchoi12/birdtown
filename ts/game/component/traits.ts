
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, TraitType } from 'game/component/api'
import { Entity } from 'game/entity'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'

export type TraitsInitOptions = {
	traits : Map<TraitType, number>;
}

export class Traits extends ComponentBase implements Component {

	private _traits : Map<TraitType, number>;

	constructor(init? : TraitsInitOptions) {
		super(ComponentType.TRAITS);

		this._traits = new Map();

		if (init) {
			init.traits.forEach((value, key) => {
				this.setTrait(key, value);
			});
		}

		for (const stringTrait in TraitType) {
			const type = Number(TraitType[stringTrait]);
			if (Number.isNaN(type) || type <= 0) {
				continue;
			}

			this.addProp<number>({
				has: () => { return this.hasTrait(type); },
				export: () => { return this.getTrait(type); },
				import: (obj : number) => { this.setTrait(type, obj); },
			})
		}
	}

	hasTrait(type : TraitType) : boolean { return this._traits.has(type); }
	setTrait(type : TraitType, value : number) : void { this._traits.set(type, value); }
	getTrait(type : TraitType) : number { return this._traits.has(type) ? this._traits.get(type) : 0; }

	rand(type : TraitType) : number { return Math.round(Math.random() * this.getTrait(type)); }

	roll(type : TraitType, value : number) : boolean {
		if (this.getTrait(type) >= value || value === 0) {
			return true;
		}

		return this.rand(type) >= Math.random() * value;
	}
}