
import { game } from 'game'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'

export enum StalenessType {
	UNKNOWN = 0,

	NONE = 0,
	LOW = 250,
	HIGH = 1000,
}

type QueryFn<T extends Entity> = (entity : T) => boolean;
type FilterFn<T extends Entity> = (entity : T) => boolean;
type QueryParams<T extends Entity> = {
	query: QueryFn<T>;
	maxStaleness: number;
}

type QueryCache = {
	result: Entity[];
	lastQuery: number;
}

export class EntityQuery {
	
	private _queries : Map<EntityType, QueryParams<Entity>>;
	private _cache : Map<EntityType, QueryCache>;

	constructor() {
		this._queries = new Map();
		this._cache = new Map();
	}

	hasQuery(type : EntityType) : boolean { return this._queries.has(type); }
	registerQuery<T extends Entity>(type : EntityType, params : QueryParams<T>) : void {
		if (this._queries.has(type)) {
			console.error("Error: skipping adding duplicate query for %s", EntityType[type]);
			return;
		}

		this._queries.set(type, params);
	}

	filter<T extends Entity>(type : EntityType, filter : FilterFn<T>) : T[] {
		if (!this._cache.has(type)) {
			this.query(type);
		}

		let filtered = [];
		this.get(type).forEach((entity : T) => {
			if (filter(entity)) {
				filtered.push(entity);
			}
		});
		return filtered;
	}

	query<T extends Entity>(type : EntityType) : T[] {
		// Query with no limit
		return this.queryN(type, 0);
	}

	queryN<T extends Entity>(type : EntityType, limit : number) : T[] {
		if (!this.shouldQuery(type)) {
			return this.get(type);
		}

		const map = game.entities().getMap(type);
		const params = this._queries.get(type);

		let result : T[];
		if (limit > 0) {
			result = map.findN<T>(params.query, limit);
		} else {
			result = map.findAll<T>(params.query);
		}

		if (!this._cache.has(type)) {
			this._cache.set(type, {
				result: result,
				lastQuery: Date.now(),
			});
		} else {
			this._cache.get(type).result = result;
			this._cache.get(type).lastQuery = Date.now();
		}
		return result;
	}
	
	private get<T extends Entity>(type : EntityType) : T[] {
		if (this._cache.has(type)) {
			return <T[]>this._cache.get(type).result;
		}
		return [];
	}

	// Should only return false if cache has results.
	private shouldQuery(type : EntityType) : boolean {
		if (!this._queries.has(type)) {
			console.error("Error: no query registered for %s", EntityType[type]);
			return false;
		}
		if (!this._cache.has(type)) {
			return true;
		}

		if (this._queries.get(type).maxStaleness > Math.max(0, Date.now() - this._cache.get(type).lastQuery)) {
			return false;
		}
		return true;
	}

}