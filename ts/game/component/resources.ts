
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Resource, ResourceUpdate } from 'game/component/resource'
import { HealthResource } from 'game/component/resource/health_resource'
import { ChangeLog } from 'game/component/util/change_log'
import { Entity } from 'game/entity'
import { StatType } from 'game/factory/api'

export type ResourcesInitOptions = {
	stats: StatType[];
}

export class Resources extends ComponentBase implements Component {

	private static readonly _createFns = new Map<StatType, () => Resource>([
		[StatType.HEALTH, () => { return new HealthResource(); }],
	])

	constructor(init : ResourcesInitOptions) {
		super(ComponentType.RESOURCES);

		init.stats.forEach((type : StatType) => {
			this.createResource(type);
		});
	}

	reset() : void {
		this.execute<Resource>((resource : Resource, type : StatType) => {
			resource.reset();
		});
	}

	hasResource(type : StatType) : boolean { return this.hasChild(type); }
	getResource(type : StatType) : number {
		if (!this.hasResource(type)) {
			console.error("Warning: missing resource for stat %s", StatType[type]);
			return 0;
		}
		return this.getSubComponent<Resource>(type).get();
	}

	// Convenience methods
	maxHealth() : number {
		if (!this.hasResource(StatType.HEALTH)) {
			return;
		}
		this.getSubComponent<HealthResource>(StatType.HEALTH).max();
	}
	fullHeal() : void {
		if (!this.hasResource(StatType.HEALTH)) {
			return;
		}
		this.getSubComponent<HealthResource>(StatType.HEALTH).reset();
	}
	setHealthPercent(percent : number) : void {
		if (!this.hasResource(StatType.HEALTH)) {
			return;
		}
		this.getSubComponent<HealthResource>(StatType.HEALTH).setHealthPercent(percent);
	}
	health() : number { return this.hasResource(StatType.HEALTH) ? this.getSubComponent<HealthResource>(StatType.HEALTH).get() : 0; }
	healthPercent() : number {
		if (!this.hasResource(StatType.HEALTH)) {
			return 0;
		}
		return this.getSubComponent<HealthResource>(StatType.HEALTH).percent();
	}
	dead() : boolean { return this.hasResource(StatType.HEALTH) && this.getSubComponent<HealthResource>(StatType.HEALTH).atMin(); }

	lastDamager(sinceMillis : number) : [ChangeLog, boolean] {
		return this.flushResource(StatType.HEALTH, (log : ChangeLog) => {
			// Pick
			if (!log.hasEntityLog() || log.entityLog().id() === this.entity().id()) {
				return false;
			}
			return true;
		}, (log : ChangeLog) => {
			// Stop
			return log.timestamp() < sinceMillis;
		});
	}

	private createResource<T extends Resource>(type : StatType) : T {
		if (Resources._createFns.has(type)) {
			return this.registerSubComponent<T>(type, <T>Resources._createFns.get(type)());
		}
		return this.registerSubComponent<T>(type, <T>new Resource(type));
	}

	updateResource(type : StatType, update : ResourceUpdate) : void {
		if (!this.hasResource(type)) {
			console.error("Error: attempting to update nonexistent stat %d for %s", type, this.name());
			return;
		}

		this.getSubComponent<Resource>(type).updateResource(update);
	}

	private flushResource(type : StatType, pick : (log : ChangeLog) => boolean, stop : (log : ChangeLog) => boolean) : [ChangeLog, boolean] {
		if (!this.hasResource(type)) {
			console.error("Error: attempting to flush nonexistent stat %d for %s", type, this.name());
			return [null, false];
		}
		return this.getSubComponent<Resource>(type).flush(pick, stop);
	}
}