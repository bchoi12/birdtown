import * as MATTER from 'matter-js'

import { Data, DataFilter } from 'game/data'
import { Entity, EntityOptions, EntityType } from 'game/entity'
import { Player } from 'game/player'
import { Wall } from 'game/wall'

export class EntityMap {
	private readonly _invalidId = 0;

	private _nextId : number;
	private _map : Map<number, Entity>;
	private _data : Data;
	private _factory : Map<EntityType, (options : EntityOptions) => Entity>;

	constructor() {
		this._nextId = 0;
		this._map = new Map<number, Entity>;
		this._data = new Data();

		this._factory =  new Map();
		this._factory.set(EntityType.PLAYER, (options : EntityOptions) => { return new Player(options); });
		this._factory.set(EntityType.WALL, (options : EntityOptions) => { return new Wall(options); });
	}

	add(type : EntityType, options : EntityOptions) : Entity {
		if (!options.id) {
			options.id = this.nextId();
		}

		const entity = this._factory.get(type)(options);
		this._map.set(options.id, entity);
		return entity;
	}

	get(id : number) : Entity {
		return this._map.get(id);
	}

	delete(id : number) : void {
		this._map.delete(id);	
	}

	update(millis : number) : void {
		this._map.forEach((entity) => {
			entity.preUpdate(millis);
		});

		this._map.forEach((entity) => {
			entity.update(millis);
		});

		this._map.forEach((entity) => {
			entity.postUpdate(millis);
		});
	}

	prePhysics(millis : number) : void {
		this._map.forEach((entity) => {
			entity.prePhysics(millis);
		});
	}

	handleCollisions(collisions : Array<MATTER.Collision>) : void {
		collisions.forEach((collision) => {
			if (!collision.pair) return;

			let pair = collision.pair;
			if (!pair.bodyA || !pair.bodyA.label || !pair.bodyB || !pair.bodyB.label) {
				return;
			}

			const idA = this.idFromLabel(pair.bodyA.label);
			const idB = this.idFromLabel(pair.bodyB.label);

			this._map.get(idA).collide(this._map.get(idB));
			this._map.get(idB).collide(this._map.get(idA));		
		});
	}

	postPhysics(millis : number) : void {
		this._map.forEach((entity) => {
			entity.postPhysics(millis);
		});
	}

	postRender(millis : number) : void {
		this._map.forEach((entity) => {
			entity.postRender(millis);
		});
	}

	updateData(seqNum : number) : void {
		this._map.forEach((entity) => {
			entity.updateData(seqNum);
		});
	}

	data(filter : DataFilter, seqNum : number) : Map<number, Object> {
		this._map.forEach((entity) => {
			const data = entity.data(filter, seqNum);
			this._data.set(entity.id(), data, seqNum, () => { return data.size > 0; })
		});
		return this._data.filtered(filter, seqNum);
	}

	private nextId() : number {
		return ++this._nextId;
	}

	private idFromLabel(label : string) : number {
		const pieces = label.split(",");
		if (pieces.length !== 2) {
			console.error("Invalid label: " + label);
			return this._invalidId;
		}

		const id = Number(pieces[1]);
		if (!Number.isInteger(id)) {
			console.error("ID from label is non-integer: " + label);
			return this._invalidId;
		}

		return id;
	}
}