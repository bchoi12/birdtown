
import { Data, DataFilter, DataMap } from 'network/data'

import { defined } from 'util/common'

export namespace GameConstants {
	export const gravity = -0.85;
}

export interface GameObject {
	ready() : boolean;
	initialized() : boolean;
	initialize() : void;
	delete() : void;
	deleted() : boolean;
	dispose() : void;

	preUpdate(millis : number) : void
	update(millis : number) : void
	postUpdate(millis : number) : void
	prePhysics(millis : number) : void
	postPhysics(millis : number) : void
	preRender() : void
	postRender() : void

	shouldBroadcast() : boolean;
	isSource() : boolean;
	data() : Data;
	dataMap(filter : DataFilter) : DataMap;
	updateData(seqNum : number) : void;
	importData(data : DataMap, seqNum : number) : void;
}

export class GameObjectBase {
	protected _initialized : boolean;
	protected _deleted : boolean;
	protected _data : Data;

	constructor() {
		this._initialized = false;
		this._deleted = false;
		this._data = new Data();
	}

	ready() : boolean { return true; };
	initialized() : boolean { return this._initialized; }
	initialize() : void { this._initialized = true; }
	delete() : void { this._deleted = true; }
	deleted() : boolean { return this._deleted; }
	dispose() : void {}

	preUpdate(millis : number) : void {}
	update(millis : number) : void {}
	postUpdate(millis : number) : void {}
	prePhysics(millis : number) : void {}
	postPhysics(millis : number) : void {}
	preRender() : void {}
	postRender() : void {}

	shouldBroadcast() : boolean { return true; }
	isSource() : boolean { return true; }
	data() : Data { return this._data; }
	dataMap(filter : DataFilter) : DataMap { return this.isSource() ? this._data.filtered(filter) : {}; }
	updateData(seqNum : number) : void {
		if (this.isSource()) {
			// TODO: run registered functions here
		}
	}
	importData(data : DataMap, seqNum : number) : void {
		if (!this.isSource()) {
			// TODO: run registered functions here
		}
	}

	protected setProp(prop : number, data : Object, seqNum : number, cb? : () => boolean) : boolean {
		if (this.isSource()) {
			return this._data.set(prop, data, seqNum, () => {
				return defined(cb) ? cb() : true;
			});
		}

		return false;
	}
}