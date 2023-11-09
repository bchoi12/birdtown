
import { Entity } from 'game/entity'
import { EntityLog } from 'game/entity/util/entity_log'

import { Optional } from 'util/optional'

type StatLogInitOptions = {
	timestamp : number;
	delta : number;
	entity? : Entity;
}

export class StatLog {

	private _timestamp : number;
	private _delta : number;
	private _entityLog : Optional<EntityLog>

	constructor(initOptions : StatLogInitOptions) {
		this._timestamp = initOptions.timestamp;
		this._delta = initOptions.delta;
		this._entityLog = new Optional();

		if (initOptions.entity) {
			this._entityLog.set(new EntityLog(initOptions.entity));
		}
	}

	timestamp() : number { return this._timestamp; }
	delta() : number { return this._delta; }

	hasEntityLog() : boolean { return this._entityLog.has(); }
	entityLog() : EntityLog {
		if (!this.hasEntityLog()) {
			console.error("Warning: retrieved EntityLog without checking if it exists");
		}
		return this._entityLog.get();
	}

}