
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, StatType } from 'game/component/api'
import { Stat, StatUpdate, StatInitOptions } from 'game/component/stat'
import { StatLog } from 'game/component/util/stat_log'
import { Entity } from 'game/entity'

export type StatsInitOptions = {
	stats : Map<StatType, StatInitOptions>;
}

export class Stats extends ComponentBase implements Component {

	constructor(init? : StatsInitOptions) {
		super(ComponentType.STATS);

		if (init) {
			init.stats.forEach((init : StatInitOptions, type : StatType) => {
				this.addStat(type, init);
			});
		}
	}

	reset() : void {
		this.execute<Stat>((stat : Stat, type : StatType) => {
			stat.reset();
		});
	}

	// Convenience methods
	health() : number { return this.hasStat(StatType.HEALTH) ? this.stat(StatType.HEALTH).current() : 0; }
	healthPercent() : number {
		if (!this.hasStat(StatType.HEALTH)) {
			return 0;
		}
		return this.stat(StatType.HEALTH).percent();
	}
	dead() : boolean { return this.hasStat(StatType.HEALTH) && this.stat(StatType.HEALTH).atMin(); }

	lastDamager(sinceMillis : number) : [StatLog, boolean] {
		return this.flushStat(StatType.HEALTH, (log : StatLog) => {
			// Pick
			if (!log.hasEntityLog() || log.entityLog().id() === this.entity().id()) {
				return false;
			}
			return true;
		}, (log : StatLog) => {
			// Stop
			return log.timestamp() < sinceMillis;
		});
	}

	addStat(type : StatType, init : StatInitOptions) : Stat { return this.registerSubComponent<Stat>(type, new Stat(init)); }
	hasStat(type : StatType) : boolean { return this.hasChild(type); }
	stat(type : StatType) : Stat {
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

	private flushStat(type : StatType, pick : (log : StatLog) => boolean, stop : (log : StatLog) => boolean) : [StatLog, boolean] {
		if (!this.hasStat(type)) {
			console.error("Error: attempting to flush nonexistent stat %d for %s", type, this.name());
			return [null, false];
		}
		return this.getSubComponent<Stat>(type).flush(pick, stop);
	}
}