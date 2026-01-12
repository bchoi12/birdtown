
import { game } from 'game'
import { AssociationType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityLog } from 'game/util/entity_log'

import { Optional } from 'util/optional'

type ChangeLogInitOptions = {
	timestamp : number;
	delta : number;
	from? : Entity;
}

export class ChangeLog {

	private _timestamp : number;
	private _delta : number;
	private _entityLog : Optional<EntityLog>

	constructor(initOptions : ChangeLogInitOptions) {
		this._timestamp = initOptions.timestamp;
		this._delta = initOptions.delta;
		this._entityLog = new Optional();

		if (initOptions.from) {
			this._entityLog.set(new EntityLog(initOptions.from));
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

	owner<T extends Entity>() : [T, boolean] {
		if (!this.hasEntityLog()) {
			return [null, false];
		}

		// Update tablet for last damager.
		const associations = this.entityLog().associations();
		if (associations.has(AssociationType.OWNER)) {
			const ownerId = associations.get(AssociationType.OWNER);
			return game.entities().getEntity<T>(ownerId);
		}

		return [null, false];
	}

}