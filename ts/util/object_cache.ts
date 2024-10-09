
import { defined } from 'util/common'
import { Optional } from 'util/optional'

export type ObjectCacheCreateFn<T extends Object> = (index : number, onLoad? : ObjectCacheOnLoadFn<T>) => T;
export type ObjectCacheOnLoadFn<T extends Object> = (t : T) => void;
export interface ObjectCacheOptions<T extends Object> {
	createFn: ObjectCacheCreateFn<T>;
	maxSize? : number;
}

export class ObjectCache<T extends Object> {

	private _objs : Set<T>;
	private _create : ObjectCacheCreateFn<T>;
	private _createCounter : number;
	private _maxSize : Optional<number>;

	constructor(options : ObjectCacheOptions<T>) {
		this._objs = new Set();
		this._create = options.createFn;
		this._createCounter = 0;
		this._maxSize = new Optional();

		if (options.maxSize) {
			this._maxSize.set(options.maxSize);
		}
	}

	private create(onLoad? : ObjectCacheOnLoadFn<T>) : T {
		this._createCounter++;
		return this._create(this._createCounter, onLoad);
	}

	size() : number { return this._objs.size; }

	borrow(onLoad? : ObjectCacheOnLoadFn<T>) : T {
		for (let obj of this._objs) {
			this._objs.delete(obj);
			if (onLoad) {
				onLoad(obj);
			}
			return obj;
		}

		return this.create(onLoad);
	}

	return(obj : T) : void {
		if (!defined(obj)) { return; }

		if (this._maxSize.hasAnd((val : number) => { return this._objs.size >= val; })) {
			return;
		}

		this._objs.add(obj);
	}
}