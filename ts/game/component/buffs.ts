
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, BuffType } from 'game/component/api'
import { Entity } from 'game/entity'
import { StatType } from 'game/factory/api'

export class Buffs extends ComponentBase implements Component {

	private _statCache : Map<StatType, number>;

	constructor() {
		super(ComponentType.BUFFS);

		this._statCache = new Map();
	}

	addBuff(type : BuffType) : void {

	}
	refresh() : void {

	}

	hasStat(type : StatType) : boolean {
		return this._statCache.has(type);
	}
	getStat(type : StatType) : number {
		if (this._statCache.has(type)) {
			return this._statCache.get(type);
		}
		return this.entity().baseStat(type);
	}
}