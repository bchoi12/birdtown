
import { Profile } from 'game/component/profile'

import { Buffer } from 'util/buffer'
import { Vec2 } from 'util/vector'

type Record = {
	penetration : Vec2;
	normal : Vec2;
}

export class CollisionInfo {

	private _snapshotVel : Vec2;
	private _records : Buffer<Record>;

	constructor() {
		this._snapshotVel = Vec2.zero();
		this._records = new Buffer();
	}

	resetAndSnapshot(profile : Profile) : void {
		this._snapshotVel.scale(0);
		this._records.clear();

		this._snapshotVel.copy(profile.vel());
	}
	vel() : Vec2 { return this._snapshotVel; }

	pushRecord(record : Record) : void {
		this._records.push(record);
	} 

	hasRecord() : boolean {
		return this._records.size() > 0;
	}

	popRecord() : Record {
		return this._records.pop();
	}
}