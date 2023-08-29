
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, StatType } from 'game/component/api'
import { Modifiers } from 'game/component/modifiers'
import { Stat, StatLog, StatUpdate, StatInitOptions } from 'game/component/stat'

import { Entity } from 'game/entity'

import { RingBuffer } from 'util/ring_buffer'
import { defined } from 'util/common'
import { Optional } from 'util/optional'

export type StatsInitOptions = {
	stats : Map<StatType, StatInitOptions>;
}

export class Stats extends ComponentBase implements Component {

	constructor(init : StatsInitOptions) {
		super(ComponentType.STATS);

		this.addNameParams({ base: "stats" });

		init.stats.forEach((init : StatInitOptions, type : StatType) => {
			this.addStat(type, init);
		});
	}

	reset() : void {
		this.executeCallback<Stat>((stat : Stat, type : StatType) => {
			stat.reset();
			stat.clearBoosts();
		});
	}

	override processComponent<T extends Component>(component : T) : void {
		if (component.type() !== ComponentType.MODIFIERS || !(component instanceof Modifiers)) {
			return;
		}

		let modifiers = <Modifiers>component;
		modifiers.applyTo(this);
		this.executeCallback<Stat>((stat : Stat) => {
			stat.boost();
		});
	}

	// Convenience methods
	health() : number { return this.hasStat(StatType.HEALTH) && this.getStat(StatType.HEALTH).getCurrent(); }
	dead() : boolean { return this.hasStat(StatType.HEALTH) && this.getStat(StatType.HEALTH).atMin(); }

	addStat(type : StatType, init? : StatInitOptions) : void { this.addSubComponent(type, new Stat(defined(init) ? init : {})); }
	hasStat(type : StatType) : boolean { return this.hasChild(type); }
	getStat(type : StatType) : Stat {
		if (!this.hasStat(type)) {
			console.error("Error: queried nonexistent stat %d for %s", type, this.name());
			return null;
		}

		return this.getSubComponent<Stat>(type);
	}

	updateStat(type : StatType, update : StatUpdate) : void {
		if (!this.hasStat(type)) {
			console.error("Error: attempting to update nonexistent stat %d for %s", type, this.name());
			return;
		}

		this.getSubComponent<Stat>(type).updateStat(update);
	}

	flushStat(type : StatType, skip : (log : StatLog) => boolean, stop : (log : StatLog) => boolean) : [StatLog, boolean] {
		if (!this.hasStat(type)) {
			console.error("Error: attempting to flush nonexistent stat %d for %s", type, this.name());
			return [null, false];
		}

		return this.getSubComponent<Stat>(type).flush(skip, stop);
	}
}