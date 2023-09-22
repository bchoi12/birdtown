
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { EntityTracker } from 'game/component/entity_tracker'
import { Entity } from 'game/entity'

export class EntityTrackers extends ComponentBase implements Component {

	constructor() {
		super(ComponentType.ENTITY_TRACKERS);

		this.setFactoryFn((entityId : number) => { return this.addEntityTracker(entityId); })
	}

	addEntityTracker(entityId : number) : EntityTracker {
		return this.registerSubComponent(entityId, new EntityTracker(entityId));
	}
}