
import { DataObject, DataObjectBase } from 'network/data'
import { Vec2 } from 'util/vector'

export class DataVec2 extends DataObjectBase<Vec2> implements DataObject<Vec2> {

	constructor() {
		super();

		this.initialize(Vec2.zero());
	}

	override get() : Vec2 { return super.get().clone(); }
	override equals(other : Vec2) { return this.get().equals(other); }
}