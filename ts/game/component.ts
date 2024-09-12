import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Entity } from 'game/entity'
import { GameData, DataFilter } from 'game/game_data'
import { GameObject, GameObjectBase, NameParams } from 'game/game_object'

import { NetworkBehavior } from 'network/api'

import { Optional } from 'util/optional'

export interface Component extends GameObject {
	type() : ComponentType;
	entity() : Entity;
	setEntity<T extends Entity>(entity : T) : void;
	processComponent<T extends Component>(component : T) : void;
}

export abstract class ComponentBase extends GameObjectBase implements Component {

	protected _entity : Optional<Entity>;
	protected _type : ComponentType;

	constructor(type : ComponentType) {
		super(ComponentType[type].toLowerCase());

		this._entity = new Optional();
		this._type = type;
	}

	override ready() : boolean {
		return super.ready() && this._entity.has();
	}

	override networkBehavior() : NetworkBehavior {
		return this._entity.has() ? this._entity.get().networkBehavior() : super.networkBehavior();
	}

	addSubComponent<T extends Component>(component : T) : T {
		return this.addChild<T>(this.populateSubComponent<T>(component, /*nameParams=*/{}));
	}
	registerSubComponent<T extends Component>(id : number, component : T) : T {
		return this.registerChild<T>(id, this.populateSubComponent<T>(component, { id: id }));
	}
	getSubComponent<T extends Component>(id : number) : T { return this.getChild<T>(id); }

	type() : ComponentType { return this._type; }
	entity() : Entity { return this._entity.get(); }
	setEntity<T extends Entity>(entity : T) : void {
		this.addNameParams({
			target: entity,
		});
		this._entity.set(entity);

		this.execute<Component>((subComponent : Component, id : number) => {
			this.populateSubComponent(subComponent, {id: id});
		});
	}

	processComponent<T extends Component>(component : T) : void {}

	// Transfer some metadata to SubComponents
	private populateSubComponent<T extends Component>(component : T, nameParams : NameParams) : T {
		if (nameParams) {
			component.addNameParams({ parent: this, ...nameParams});
		}
		if (this._entity.has()) {
			component.setEntity(this._entity.get());
		}
		return component;
	}
}