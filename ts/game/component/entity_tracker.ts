
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'

import { CircleMap } from 'util/circle_map'

export class EntityTracker<T extends Entity> extends ComponentBase implements Component {
 
 	private _newIds : Set<number>;
	private _entities : CircleMap<number, T>;

	constructor() {
		super(ComponentType.ENTITY_TRACKER);

		this._newIds = new Set();
		this._entities = new CircleMap();
	
		this.addProp<number[]>({
			export: () => { return this._entities.keys(); },
			import: (obj : Array<number>) => { this.trackIds(obj); },
			options: {
				equals: (a : number[], b : number[]) => {
					if (a.length !== b.length) { return false; }
					if (a.length === 0) { return true; }
					return a[a.length - 1] === b[b.length - 1];
				}
			}
		});
	}

	trackIds(ids : number[]) : void {
		ids.forEach((id : number) => { this._newIds.add(id); });
		this.queryIds();
	}
	trackEntity(entity : T) : void {
		entity.setState(this.state());
		this._entities.push(entity.id(), entity);
		this._newIds.delete(entity.id());
	}

	numEntities() : number { return this._entities.size(); }
	getEntityMap() : CircleMap<number, T> { return this._entities; }

	override delete() : void {
		super.delete();

		this._entities.execute((entity : T) => {
			entity.delete();
		});
	}

	override setState(state : GameObjectState) : void {
		super.setState(state);

		this._entities.execute((entity : T) => {
			entity.setState(state);
		});
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		this.queryIds();
	}

	override cleanup() : void {
		super.cleanup();

		// Clean up anything that was deleted
		this._entities.execute((entity : T, id : number) => {
			if (entity.deleted()) {
				this._entities.delete(id);
			}
		});
	}

	private queryIds() : void {
		// Query any outstanding IDs
		this._newIds.forEach((id : number) => {
			const [entity, has] = game.entities().getEntity<T>(id);

			if (has) {
				this.trackEntity(entity);
			} else if (game.entities().isDeleted(id)) {
				this._newIds.delete(id);
			}
		});
	}
}