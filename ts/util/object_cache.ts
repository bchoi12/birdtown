
import { defined } from 'util/common'
import { Optional } from 'util/optional'

type OnLoadFn<T extends Object> = (t : T) => void;
type CreateFn<T extends Object> = (onLoad? : OnLoadFn<T>) => T;

export type ObjectCacheOptions<T extends Object> = {
	createFn: CreateFn<T>;
	maxSize? : number;
}

export class ObjectCache<T extends Object> {

	private _objs : Set<T>;
	private _create : CreateFn<T>;
	private _maxSize : Optional<number>;

	constructor(options : ObjectCacheOptions<T>) {
		this._objs = new Set();
		this._create = options.createFn;
		this._maxSize = new Optional();

		if (options.maxSize) {
			this._maxSize.set(options.maxSize);
		}
	}

	create(onLoad? : OnLoadFn<T>) : T {
		return this._create(onLoad);
	}

	borrow(onLoad? : OnLoadFn<T>) : T {
		for (let obj of this._objs) {
			this._objs.delete(obj);
			if (defined(onLoad)) {
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