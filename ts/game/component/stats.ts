
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

		this.setName({ base: "stats" });

		init.stats.forEach((init : StatInitOptions, type : StatType) => {
			this.addSubComponent(type, new Stat(init));
		});
	}

	reset(modifiers? : Modifiers) : void {
		this.executeCallback<Stat>((stat : Stat, type : StatType) => {
			stat.reset();
			stat.clearBoosts();
			if (defined(modifiers)) {
				modifiers.apply(type, stat);	
			}
			stat.boost();
		});
	}

	// Convenience methods
	health() : number { return this.hasStat(StatType.HEALTH) && this.getStat(StatType.HEALTH).getStat().get(); }
	dead() : boolean { return this.hasStat(StatType.HEALTH) && this.getStat(StatType.HEALTH).atMin(); }

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