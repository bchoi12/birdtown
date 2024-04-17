
import * as MATTER from 'matter-js'

import { Profile } from 'game/component/profile'
import { Entity } from 'game/entity'

import { Buffer } from 'util/buffer'
import { Vec2 } from 'util/vector'

type Record = {
	entity : Entity;
	collision : MATTER.Collision;
	fixed: boolean;
}

export enum RecordType {
	UNKNOWN,

	MAX_PEN_X,
	MIN_PEN_X,
	MAX_PEN_Y,
	MIN_PEN_Y,

	MAX_NORMAL_Y,
}

type ComparatorFn = (record : Record, current : Record) => boolean;

export class CollisionBuffer {

	private _records : Buffer<Record>;
	private _index : Map<RecordType, number>;
	private _fixed : boolean;

	constructor() {
		this._records = new Buffer();
		this._index = new Map();
		this._fixed = false;
	}

	reset() : void {
		this._records.clear();
		this._index.clear();
		this._fixed = false;
	}

	fixed() : boolean { return this._fixed; }
	hasRecords() : boolean { return this._records.size() > 0; }
	pushRecord(record : Record) : void {
		if (record.fixed) {
			this._fixed = true;
		}

		if (record.collision.penetration.x === 0 && record.collision.penetration.y === 0 && record.fixed) {
			return;
		}

		this._records.push(record);

		if (this._records.size() <= 1) {
			return;
		}

		const index = this._records.size() - 1;

		this.updateRecord(RecordType.MAX_PEN_X, index, (record : Record, current : Record) => {
			return record.collision.penetration.x > current.collision.penetration.x;
		});
		this.updateRecord(RecordType.MAX_PEN_Y, index, (record : Record, current : Record) => {
			return record.collision.penetration.y > current.collision.penetration.y;
		});
		this.updateRecord(RecordType.MIN_PEN_X, index, (record : Record, current : Record) => {
			return record.collision.penetration.x < current.collision.penetration.x;
		});
		this.updateRecord(RecordType.MIN_PEN_Y, index, (record : Record, current : Record) => {
			return record.collision.penetration.y < current.collision.penetration.y;
		});
		this.updateRecord(RecordType.MAX_NORMAL_Y, index, (record : Record, current : Record) => {
			return record.collision.normal.y > current.collision.normal.y;
		});
	}

	record(type : RecordType) : Record {
		if (!this.hasRecords()) {
			console.error("Error: retrieving record when there are none.");
		}
		return this._records.get(this.index(type));
	}

	private updateRecord(type : RecordType, index : number, fn : ComparatorFn) : void {
		if (fn(this._records.get(index), this.record(type))) {
			this._index.set(type, index);
		}
	}

	private index(type : RecordType) : number {
		return this._index.has(type) ? this._index.get(type) : 0;
	}
}