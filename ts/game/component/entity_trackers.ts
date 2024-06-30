
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { EntityTracker } from 'game/component/entity_tracker'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'

import { CircleMap } from 'util/circle_map'

export class EntityTrackers extends ComponentBase implements Component {

	constructor() {
		super(ComponentType.ENTITY_TRACKERS);

		this.setFactoryFn((type : EntityType) => { return this.addEntityTracker(type); })
	}

	trackEntity<T extends Entity>(type : EntityType, entity : T) : void {
		if (!entity.allTypes().has(type)) {
			console.error("Error: cannot track entity (not %s)", EntityType[type], entity);
			return;
		}

		if (!this.hasEntityType(type)) {
			this.addEntityTracker<T>(type);
		}

		this.getChild<EntityTracker<T>>(type).trackEntity(entity);
	}

	hasEntityType(type : EntityType) : boolean { return this.hasChild(type); }
	clearEntityType(type : EntityType) : void {
		if (!this.hasEntityType(type)) {
			return;
		}
		this.getEntities(type).execute((entity : Entity) => {
			entity.delete();
		});
		this.getEntities(type).clear();
	}

	getEntities<T extends Entity>(type : EntityType) : CircleMap<number, T> {
		if (!this.hasEntityType(type)) { return new CircleMap(); }

		return this.getChild<EntityTracker<T>>(type).getEntityMap();
	}

	private addEntityTracker<T extends Entity>(type : EntityType) : EntityTracker<T> {
		return this.registerSubComponent(type, new EntityTracker<T>());
	}
}