
import { DataObject, DataObjectBase } from 'network/data'

export class Int extends DataObjectBase<number> implements DataObject<number> {

	constructor() {
		super();

		this.initialize(0);
	}

	override valid(value : number) : boolean { return Number.isInteger(value); }
}