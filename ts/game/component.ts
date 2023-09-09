import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Entity } from 'game/entity'
import { GameData, DataFilter } from 'game/game_data'
import { GameObject, GameObjectBase} from 'game/game_object'

import { NetworkBehavior } from 'network/api'

import { defined } from 'util/common'

export interface Component extends GameObject {
	type() : ComponentType;
	entity() : Entity;
	setEntity<T extends Entity>(entity : T) : void;
	processComponent<T extends Component>(component : T) : void;
}

export abstract class ComponentBase extends GameObjectBase implements Component {

	protected _entity : Entity;
	protected _type : ComponentType;

	constructor(type : ComponentType) {
		super("component-" + type);

		this._entity = null;
		this._type = type;
	}

	override ready() : boolean { return defined(this._entity); }

	addSubComponent<T extends Component>(id : number, component : T) : T {
		return this.registerChild(id, this.populateSubComponent<T>(id, component));
	}
	getSubComponent<T extends Component>(id : number) : T { return this.getChild<T>(id); }

	type() : ComponentType { return this._type; }
	entity() : Entity { return this._entity; }
	setEntity<T extends Entity>(entity : T) : void {
		this.addNameParams({
			target: entity,
		});
		this._entity = entity;

		this.execute<Component>((subComponent : Component, id : number) => {
			this.populateSubComponent(id, subComponent);
		});
	}

	processComponent<T extends Component>(component : T) : void {}

	// Transfer some metadata to SubComponents
	private populateSubComponent<T extends Component>(id : number, component : T) : T {
		component.addNameParams({
			parent: this,
			id: id,
		});
		if (defined(this._entity)) {
			component.setEntity(this._entity);
		}
		return component;
	}
}