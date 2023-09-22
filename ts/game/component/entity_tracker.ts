
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'

export class EntityTracker extends ComponentBase implements Component {

	private _entityId : number;
	private _trackedEntity : Entity;

	constructor(entityId : number) {
		super(ComponentType.ENTITY_TRACKER);

		this._entityId = entityId;
		this._trackedEntity = null;
	
		this.addProp({
			export: () => { return this._entityId; },
			import: (obj : number) => { this._entityId = obj; },
		});
	}

	entityType() : EntityType { return this.hasEntity() ? this._trackedEntity.type() : EntityType.UNKNOWN; }
	hasEntity() : boolean { return this._trackedEntity !== null; }
	getEntity<T extends Entity>() : [T, boolean] {
		if (this._trackedEntity === null) {
			return game.entities().getEntity<T>(this._entityId);
		}

		return [<T>this._trackedEntity, true];
	}

}